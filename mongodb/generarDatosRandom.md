# Generadores de datos random para MongoDB

Nuestro objetivo será poder generar una gran cantidad de datos en una colección Mongo. Hay varias opciones (más abajo encontrarán scripts que podés correr en diferentes tecnologías), nosotros elegimos [este proyecto](https://github.com/rueckstiess/mgeneratejs) que es bastante simple y directo.

## Instalación

Es un componente que se instala por npm por línea de comando (desde una terminal de Visual Studio Code, Git Bash o consola de Linux):

```bash
npm install -g mgeneratejs
```

## Ejecución

Desde la misma consola escribís:

```bash
mgeneratejs '{"name": "$name", "age": "$age", "emails": {"$array": {"of": "$email", "number": 3}}}' -n 1000000 > test_data.json
```

Eso nos genera la lista de usuarios, edades y mails en el archivo `test_data.json`. A continuación levantamos el servicio mongo (si no estaba ya levantado):

```bash
sudo service mongod start
```

y ejecutamos la importación desde la consola (no desde el MongoDB shell):

```bash
mongoimport --collection students 'test_data.json'
```

## Verificación

Dentro de Robo3T hacemos esta consulta:

```bash
db.getCollection('students').find({name: 'Norman Robinson'})
```

Que tarda en mi máquina 0.266 segundos (nada mal para 1.000.000 de elementos).

## Alternativas en otras tecnologías

* [How to generate random test data](https://farenda.com/mongodb/how-to-generate-random-test-data-in-mongodb/)
* https://github.com/feliixx/mgodatagen (Go)
* https://www.mockaroo.com/
* https://github.com/mongodb-labs/ipsum (Python)

## Links

* [Volver al menú principal](../README.md)
