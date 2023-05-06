# Taller de Sharding

Este tutorial sigue los pasos de [este instructivo](https://github.com/minhhungit/mongodb-cluster-docker-compose) para trabajar con contenedores Docker de MongoDB. Si querés ver cómo se logra generar el sharding en forma manual, podés ver [esta página](./shardingTallerManual.md).

## Advertencia para Windows y MacOS

TODO

## Inicio del sharding

### 1. Levantando los contenedores

Desde la carpeta `sharding` en una terminal o Git Bash ejecutás:

```bash
docker compose up -d
```

Al final de la ejecución podés probar que los containers se levantaron correctamente:

```bash
docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS          PORTS                                           NAMES
f94bddfe4c84   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27121->27017/tcp, :::27121->27017/tcp   mongo-config-03
787f970d7688   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27120->27017/tcp, :::27120->27017/tcp   mongo-config-02
4bd17eec81d0   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27119->27017/tcp, :::27119->27017/tcp   mongo-config-01
a665e6bf8339   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27122->27017/tcp, :::27122->27017/tcp   shard-01-node-a
54170db8265e   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27128->27017/tcp, :::27128->27017/tcp   shard-03-node-a
832b8f354424   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27125->27017/tcp, :::27125->27017/tcp   shard-02-node-a
22218f53ac7d   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27118->27017/tcp, :::27118->27017/tcp   router-02
ba446aad6d94   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27130->27017/tcp, :::27130->27017/tcp   shard-03-node-c
2ed1db76fef8   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27126->27017/tcp, :::27126->27017/tcp   shard-02-node-b
f7f42f4963f1   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27127->27017/tcp, :::27127->27017/tcp   shard-02-node-c
0fd0cecd1873   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27123->27017/tcp, :::27123->27017/tcp   shard-01-node-b
5ee2e51330ab   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27124->27017/tcp, :::27124->27017/tcp   shard-01-node-c
3b0d00d12ec2   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27117->27017/tcp, :::27117->27017/tcp   router-01
ad0a1f3efca0   mongo:latest   "docker-entrypoint.s…"   14 hours ago   Up 21 minutes   0.0.0.0:27129->27017/tcp, :::27129->27017/tcp   shard-03-node-b

```

### 2. Levantar los servers de configuración

```bash
docker compose exec configsvr01 sh -c "mongosh < /scripts/init-configserver.js"
```

### 3. Levantar shards (instancias de mongod)

```bash
docker compose exec shard01-a sh -c "mongosh < /scripts/init-shard01.js"
docker compose exec shard02-a sh -c "mongosh < /scripts/init-shard02.js"
docker compose exec shard03-a sh -c "mongosh < /scripts/init-shard03.js"
```

Cada shard va a tener un esquema de replicación de 3 instancias. Por ejemplo, el shard01 tendrá

- un nodo primario: shard01-a
- dos nodos secundarios: shard01-b y shard01-c

Recordá que lo podés ver conectándote a un nodo: `docker exec -it shard-01-node-a bash` y en `mongosh` chequear la configuración con `rs.status()`.

El nodo 2 tendrá como nodo primario shard02-a y como nodos secundarios shard02-b y shard02-c. Para conectarte al contenedor tenés que usar el nombre `shard-02-node-a`. En general los nombres de cada contenedor serán `shard-xx-node-y` donde `xx` es el número de shard (1, 2, 3), `y` es el nodo de réplica (a, b, c).

### 4. Levantar routers

Dejando pasar un cierto tiempo (45 segundos por ejemplo), levantamos todas las instancias:

```bash
docker compose exec router01 sh -c "mongosh < /scripts/init-router.js"
```

### 5. Verificación

Para estar seguros de que todo está correctamente configurado, ejecutamos:

```bash
docker compose exec router01 mongosh --port 27017
```

Y luego

```js
sh.status()
```

Aquí deberías ver que tenemos

- los 3 shards activos (rs-shard-01, rs-shard-02 y rs-shard-03)
- los servicios que tenemos activos (autosplit o splitter, balancer)
- y las bases de datos deben aparecer como particionadas

![verificacion sharding](../images/sharding/sh-status.gif)

## Arquitectura del esquema de sharding

Podemos ver la arquitectura resultante (gracias al usuario `minhhungit` por la imagen):

![Arquitectura de sharding](../images/sharding/sharding-handson-architecture.png)

## Insertando un set de datos

Nos conectaremos a continuación a alguna de las instancias del router, por ejemplo a `router-01`:

![conexión router](../images/sharding/sharding-connection.png)

```bash
docker exec -it router-01 bash
```

Crearemos una database `finanzas` y cargaremos 30.000 facturas que se encuentran en [este archivo](./scripts/facturas.js). Lo bueno es que en la configuración de [docker compose](./docker-compose.yml) ya le dijimos que lo copie al contenedor, al directorio `scripts`. Vamos a chequear que el archivo `facturas.js` esté ahí:

```bash
ls -la /scripts
...
-rw-rw-r-- 1 1000 1000 13627495 Apr 30 14:56 facturas.js
```

Además de los otros scripts que utilizamos para levantar las instancias, está el archivo facturas. Ahora activamos el shell de mongo:

```bash
mongosh
```

y agregamos la información desde la nueva database:

```js
use finanzas
load("/scripts/facturas.js")
```

Ahora podés probar cuántas facturas hay cargadas:

```js
db
//finanzas -> confirmamos que la base es finanzas
db.facturas.countDocuments()
// 30870
```

Abrimos 3 ventanas, conectándonos cada una al shard 1, 2 ó 3 primario:

```bash
docker compose exec shard01-a mongosh
# fíjense que acá estamos usando shard01-a porque referenciamos a la definición de docker compose
# si no deberíamos hacer 
# docker exec -it shard-01-node-a bash
# porque `shard-01-node-a` es el nombre que le pusimos al contenedor

# y luego desde otra terminal (hay que chequear cuál es el nodo primario, o ejecutar `db.getMongo().setReadPref("secondary")`)
docker compose exec shard02-a mongosh
# y luego desde otra terminal
docker compose exec shard03-a mongosh
```

y vemos dónde están las facturas:

```js
use finanzas
db.facturas.countDocuments()
```

¡El resultado te sorprenderá! Pese a que activamos el sharding, todas las facturas están en un solo shard, mientras que el resto de los shards está vacío.

![Sharding sin configurar](../images/sharding/sharding-no-config.png)

![Decepción](../images/sharding/disappointed.png)

## Definiendo la shard key -> por rango

Volvamos al cliente que apunta al router (el del puerto 28001):

```js
use finanzas

-- creamos el índice de facturas por región y condición de pago
db.facturas.ensureIndex({"cliente.region":1,"condPago":1})

-- habilitamos el sharding para la database finanzas
sh.enableSharding("finanzas")

-- definimos la clave por el índice que anteriormente generamos (región y condición de pago ascendente)
sh.shardCollection("finanzas.facturas", {"cliente.region":1,"condPago":1 },false)

-- vemos los chunks que se generaron
use config
db.chunks.find({},
{min:1,max:1,shard:1,_id:0,ns:1}).pretty()

-- corremos muuuuuchas veces más el mismo script (7 veces mínimo)
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
```

Y volvemos a ejecutar el query de chunks:

```js
use config
db.chunks.find({}, {min:1,max:1,shard:1,_id:0,ns:1}).pretty()
```

Nos conectamos a cada shard para buscar una factura contado de CABA:

```js
db.facturas.find({"cliente.region": "CABA", "condPago": "CONTADO" }).limit(2).pretty()
```

Podemos igualmente forzar un split manualmente:

```js
sh.splitAt("finanzas.facturas", { "cliente.region": "CENTRO", condPago: "EFECTIVO"  })
```

Esto ahora produce que en el router veamos

```js
use finanzas
db.facturas.count()
176880
```

mientras que en el tercer shard (o aquel donde teníamos todos los documentos)

```js
use finanzas
db.facturas.count()
123480
```

Podríamos definir una clave _hashed_, pero eso ya no es tan fácil ahora que hemos definido los shards:

```js
sh.shardCollection("finanzas.facturas", { "id": "hashed" })
{
	"ok" : 0,
	"errmsg" : "sharding already enabled for collection finanzas.facturas with options { _id: \"finanzas.facturas\", lastmodEpoch: ObjectId('5cd2295e081f213b3f3044c3'), lastmod: new Date(4294967296), dropped: false, key: { cliente.region: 1.0, condPago: 1.0 }, unique: false, uuid: UUID(\"2e521d61-3e0d-4646-8884-15d1dbc63300\") }",
	"code" : 23,
	"codeName" : "AlreadyInitialized",
	"operationTime" : Timestamp(1557277375, 4),
	"$clusterTime" : {
		"clusterTime" : Timestamp(1557277375, 4),
		"signature" : {
			"hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
			"keyId" : NumberLong(0)
		}
	}
}
```

## Otra oportunidad! Otra oportunidad!

Si ingresamos al directorio y eliminamos los shards

```bash
cd ~/data/mongodb/sharding
rm -rf cfg1 cfg2 shard1 shard2 shard3 repl1 repl2 repl3
```

Podemos volver a hacer el taller, pero ahora cambiaremos la configuración para utilizar un índice hashed. Salteamos cuando llegamos al párrafo "Definiendo la shard key -> por rango" y seguimos con esta opción.

## Definiendo la shard key -> hashed

```js
use finanzas

-- creamos el índice de facturas por hash del número, lo que asegurará buena dispersión
db.facturas.ensureIndex({"nroFactura": "hashed"})

-- habilitamos el sharding para la database finanzas
sh.enableSharding("finanzas")

-- definimos la clave por el índice que anteriormente generamos (región y condición de pago ascendente)
sh.shardCollection("finanzas.facturas", {"nroFactura": "hashed" }, false)

-- corremos el mismo script varias veces
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")
load("scripts/facts.js")

-- vemos los chunks que se generaron
use config
db.chunks.find({}, {min:1,max:1,shard:1,_id:0,ns:1}).pretty()
```

O bien, mucho más claro,

```js
use finanzas
db.facturas.getShardDistribution()
```


Y ahora sí:

```
Shard shard03 at shard03/shard03a:27020,shard03b:27020
 data : 34.87MiB docs : 111089 chunks : 2
 estimated data per chunk : 17.43MiB
 estimated docs per chunk : 55544

Shard shard01 at shard01/shard01a:27018,shard01b:27018
 data : 36.32MiB docs : 115896 chunks : 2
 estimated data per chunk : 18.16MiB
 estimated docs per chunk : 57948

Shard shard02 at shard02/shard02a:27019,shard02b:27019
 data : 35.29MiB docs : 112585 chunks : 2
 estimated data per chunk : 17.64MiB
 estimated docs per chunk : 56292

Totals
 data : 106.49MiB docs : 339570 chunks : 6
 Shard shard03 contains 32.74% data, 32.71% docs in cluster, avg obj size on shard : 329B
 Shard shard01 contains 34.1% data, 34.13% docs in cluster, avg obj size on shard : 328B
 Shard shard02 contains 33.14% data, 33.15% docs in cluster, avg obj size on shard : 328B

```

Podemos entrar en cada uno de los shards (mongod en lugar del mongos):

```bash
mongosh --port 27000
```

Y vemos cuántas facturas se generaron:

```js
use finanzas
db.facturas.count()
// 52680 --> es un estimativo
```

Lo mismo hacemos en el 27100 (en el ejemplo nos dio 51.175) y en el 27200 (50.495)

## Links

- http://juanroy.es/es/how-to-set-up-a-mongodb-sharded-cluster/
- https://www.bit.es/knowledge-center/mongodb-para-big-data-replicacion-y-sharding-iii/
- https://medium.com/@tudip/mongodb-sharding-replication-and-clusters-d95a6595bd2c
