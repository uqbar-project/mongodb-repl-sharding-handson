#!/usr/bin/env node
/**
 * Generador de datos de clientes para MongoDB Sharding.
 *
 * Este script genera 1.000.000 de documentos de clientes ficticios usando Faker.
 * Por defecto opera en modo DRY-RUN: genera los datos pero NO los inserta en la base.
 * Para insertar, pasar el flag --insertar.
 *
 * Configuración (archivo .env):
 *     MONGODB_URI=mongodb://localhost:27117
 *     DB_NAME=negocio
 *     COLLECTION_NAME=clientes
 *
 * Instalación:
 *     npm install
 *
 * Uso:
 *     # Solo generar y mostrar estadísticas (sin tocar la DB)
 *     npx tsx scripts/generar-clientes.ts
 *
 *     # Generar e insertar en el router del cluster shard
 *     npx tsx scripts/generar-clientes.ts --insertar
 */
import 'dotenv/config'
import { faker } from '@faker-js/faker'
import { MongoClient, type Document } from 'mongodb'

const REGIONES = ['CABA', 'CENTRO', 'NOA', 'NEA', 'CUYO', 'PATAGONIA', 'LITORAL'] as const
const CATEGORIAS = ['VIP', 'Regular', 'Nuevo'] as const
const PROVINCIAS = [
  'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

interface ResultadoOperacion {
  total: number
  clienteEjemplo: Cliente | null
}

interface Cliente extends Document {
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: {
    calle: string
    ciudad: string
    provincia: string
    codigoPostal: string
  }
  dni: number
  cuit: string
  fechaRegistro: Date
  categoria: typeof CATEGORIAS[number]
  region: typeof REGIONES[number]
  activo: boolean
}

const MULTIPLICADORES_CUIT = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5]
const PREFIJOS_CUIT = [20, 23, 24, 27, 30, 33, 34]

function generarDNI(): number {
  return faker.number.int({ min: 1_000_000, max: 99_999_999 })
}

function elegirPrefijoCUIT(): number {
  return faker.helpers.arrayElement(PREFIJOS_CUIT)
}

function calcularDigitoVerificador(cuitSinVerif: string): number {
  const suma = cuitSinVerif
    .split('')
    .reverse()
    .map((digito, i) => parseInt(digito) * MULTIPLICADORES_CUIT[i])
    .reduce((acc, val) => acc + val, 0)

  const resto = suma % 11
  const prefijo = parseInt(cuitSinVerif.slice(0, 2))

  if (resto === 0) return 0
  if (resto === 1) return (prefijo === 23 || prefijo === 33) ? 9 : 4
  return 11 - resto
}

function generarCUIT(dni: number): string {
  const prefijo = elegirPrefijoCUIT()
  const cuitSinVerif = `${prefijo}${String(dni).padStart(8, '0')}`
  const verificador = calcularDigitoVerificador(cuitSinVerif)

  return `${prefijo}-${String(dni).padStart(8, '0')}-${verificador}`
}

function crearDireccion() {
  return {
    calle: faker.location.streetAddress(),
    ciudad: faker.location.city(),
    provincia: faker.helpers.arrayElement(PROVINCIAS),
    codigoPostal: faker.location.zipCode('####'),
  }
}

function crearCliente(): Cliente {
  const dni = generarDNI()
  const nombre = faker.person.firstName()
  const apellido = faker.person.lastName()

  return {
    nombre,
    apellido,
    email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@${faker.internet.domainName()}`,
    telefono: faker.phone.number(),
    direccion: crearDireccion(),
    dni,
    cuit: generarCUIT(dni),
    fechaRegistro: faker.date.between({ from: '2010-01-01', to: new Date() }),
    categoria: faker.helpers.arrayElement(CATEGORIAS),
    region: faker.helpers.arrayElement(REGIONES),
    activo: faker.datatype.boolean({ probability: 0.85 }),
  }
}

function* generarClientes(cantidad: number): Generator<Cliente> {
  for (let i = 0; i < cantidad; i++) {
    yield crearCliente()
  }
}

function obtenerConfiguracion() {
  return {
    insertar: process.argv.includes('--insertar'),
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27117',
    dbName: process.env.DB_NAME || 'negocio',
    collectionName: process.env.COLLECTION_NAME || 'clientes',
    total: 1_000_000,
    batchSize: 10_000,
  }
}

async function insertarLotes(
  generador: Generator<Cliente>,
  collection: any,
  config: { batchSize: number }
): Promise<ResultadoOperacion> {
  let total = 0
  let batch: Cliente[] = []
  let clienteEjemplo: Cliente | null = null
  const inicio = Date.now()

  for (const cliente of generador) {
    if (!clienteEjemplo) clienteEjemplo = cliente
    batch.push(cliente)

    if (batch.length >= config.batchSize) {
      await collection.insertMany(batch)
      total += batch.length
      batch = []

      if (total % 100_000 === 0) {
        const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
        console.log(`  ${total.toLocaleString()} insertados... (${segundos}s)`)
      }
    }
  }

  if (batch.length > 0) {
    await collection.insertMany(batch)
    total += batch.length
  }

  return { total, clienteEjemplo }
}

async function contarClientes(generador: Generator<Cliente>): Promise<ResultadoOperacion> {
  let clienteEjemplo: Cliente | null = null
  let total = 0

  for (const cliente of generador) {
    if (!clienteEjemplo) clienteEjemplo = cliente
    total++
  }

  return { total, clienteEjemplo }
}

async function main() {
  const config = obtenerConfiguracion()

  console.log(`Generando ${config.total.toLocaleString()} clientes ficticios...`)
  console.log(`Router: ${config.uri}`)
  console.log(`Destino: ${config.dbName}.${config.collectionName}`)
  console.log(`Modo: ${config.insertar ? 'INSERTAR' : 'DRY-RUN (sin insertar)'}`)
  console.log('')

  const inicio = Date.now()
  const generador = generarClientes(config.total)

  let resultado

  if (config.insertar) {
    const client = new MongoClient(config.uri)
    await client.connect()
    const collection = client.db(config.dbName).collection<Cliente>(config.collectionName)

    resultado = await insertarLotes(generador, collection, config)
    await client.close()
  } else {
    resultado = await contarClientes(generador)
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(2)

  console.log(`\n✅ Listo: ${resultado.total.toLocaleString()} clientes generados en ${duracion}s`)

  if (resultado.clienteEjemplo) {
    console.log('\n📄 Ejemplo de documento generado:')
    console.log(JSON.stringify(resultado.clienteEjemplo, null, 2))
  }

  if (!config.insertar) {
    console.log('\n⚠️  Se ejecutó en modo DRY-RUN. Los datos NO fueron insertados.')
    console.log(`💡 Para insertar ejecutá:\n   npx tsx scripts/generar-clientes.ts --insertar`)
    console.log(`   Editá .env para cambiar la URI de conexión si es necesario.`)
  }
}

/**
 * RECOMENDACIÓN DE SHARD KEY (por rango)
 * ======================================
 * Para distribuir los 1.000.000 de clientes uniformemente entre los 3 shards,
 * usar una clave compuesta que combine una dimensión categórica con alta cardinalidad:
 *
 *   db.clientes.createIndex({ region: 1, dni: 1 })
 *   sh.shardCollection('negocio.clientes', { region: 1, dni: 1 })
 *
 * Por qué funciona bien:
 * - `region` (7 valores: CABA, CENTRO, NOA, NEA, CUYO, PATAGONIA, LITORAL)
 *   divide los datos en bloques lógicos que se reparten entre los shards.
 * - `dni` (único, numérico) asegura distribución uniforme DENTRO de cada región
 *   y evita "jumbo chunks" (chunks que crecen indefinidamente).
 *
 * Alternativa para consultas históricas:
 *   { region: 1, fechaRegistro: 1, dni: 1 }
 *
 * Para habilitar desde el router (router01):
 *   use negocio
 *   db.clientes.createIndex({ region: 1, dni: 1 })
 *   sh.enableSharding('negocio')
 *   sh.shardCollection('negocio.clientes', { region: 1, dni: 1 })
 */
main().catch((err) => {
  console.error(err)
  process.exit(1)
})
