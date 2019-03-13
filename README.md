
# Clase de particionamiento

## Generadores de datos random para MongoDB

https://github.com/rueckstiess/mgeneratejs

```bash
npm install -g mgeneratejs
```

Lo ejecutamos

```bash
mgeneratejs '{"name": "$name", "age": "$age", "emails": {"$array": {"of": "$email", "number": 3}}}' -n 1000000 > test_data.json
```

Eso nos genera la lista de usuarios, edades y mails en el archivo `test_data.json`. A continuación levantamos el servicio mongo (si no estaba ya levantado):

```bash
sudo service mongod start
```

y ejecutamos la importación desde la consola (no desde el MongoDB shell):

```bash
mongoimport  --collection students 'test_data.json'
```

Dentro de Robo3T hacemos esta consulta:

```bash
db.getCollection('students').find({name: 'Norman Robinson'})
```

Que tarda en mi máquina 0.266 segundos (nada mal para 1.000.000 de elementos).

## Replicas

Crear tres carpetas:

* ~/data/mongodb/cluster1
* ~/data/mongodb/cluster2
* ~/data/mongodb/cluster3

Definimos la replica para el primer cluster:

```bash
mongod --replSet rs_cluster1 --dbpath ~/data/mongodb/cluster1 --logpath ~/data/mongodb/cluster1/log.cluster1 --port 27058 --smallfiles --oplogSize 50
```

Y accedemos a una sesión de Mongo en el puerto correspondiente:

```bash
mongo --port 27058
```

Definimos la variable de configuración apuntando al cluster 1, e iniciamos la réplica:

```js
> cfg={_id:"rs_cluster1",members:[{_id:0, host:"localhost:27058"}]}
{
	"_id" : "rs_cluster1",
	"members" : [
		{
			"_id" : 0,
			"host" : "localhost:27058"
		}
	]
}

> rs.initiate (cfg)
{ "ok" : 1 }
```

```js
db.prueba.insert({x:100})
db.prueba.insert({x:200})
db.prueba.insert({x:300,y:200})
db.prueba.find()
```

Volvemos a ejecutar en dos sesiones de consola (no de MongoDB):

```bash
mongod --replSet rs_cluster1 --dbpath ~/data/mongodb/cluster2 --logpath ~/data/mongodb/cluster2/log.cluster2 --port 27059 --smallfiles --oplogSize 50
mongod --replSet rs_cluster1 --dbpath ~/data/mongodb/cluster3 --logpath ~/data/mongodb/cluster3/log.cluster3 --port 27060 --smallfiles --oplogSize 50
```

Y en la sesión de mongo apuntando al puerto 27058 hacemos:

```js
// mongo --port 27058
cfg={_id:"rs_cluster1",members:[{_id:0, host:"localhost:27058"},{_id:1,host:"localhost:27059"}]}
rs.reconfig(cfg)
```

Vemos ahora la configuración de las réplicas:

```js
rs_cluster1:PRIMARY> rs.conf()
{
	"_id" : "rs_cluster1",
	"version" : 2,
	"protocolVersion" : NumberLong(1),
	"members" : [
		{
			"_id" : 0,
			"host" : "localhost:27058",
			"arbiterOnly" : false,
			"buildIndexes" : true,
			"hidden" : false,
			"priority" : 1,
			"tags" : {
				
			},
			"slaveDelay" : NumberLong(0),
			"votes" : 1
		},
		{
			"_id" : 1,
			"host" : "localhost:27059",
			"arbiterOnly" : false,
			"buildIndexes" : true,
			"hidden" : false,
			"priority" : 1,
			"tags" : {
				
			},
			"slaveDelay" : NumberLong(0),
			"votes" : 1
		}
	],
	"settings" : {
		"chainingAllowed" : true,
		"heartbeatIntervalMillis" : 2000,
		"heartbeatTimeoutSecs" : 10,
		"electionTimeoutMillis" : 10000,
		"catchUpTimeoutMillis" : 60000,
		"getLastErrorModes" : {
			
		},
		"getLastErrorDefaults" : {
			"w" : 1,
			"wtimeout" : 0
		},
		"replicaSetId" : ObjectId("5c8860523ca7b039558efdf0")
	}
}
```

Hacemos un insert:

```js
rs_cluster1:PRIMARY> db.prueba.insert({x:184})
WriteResult({ "nInserted" : 1 })
```

Abrimos una sesión en Robo3T, accediendo a localhost:27059 (la réplica):

```js
db.getCollection('prueba').find({})
```

### Material

* [Conceptos de replicación](https://docs.mongodb.com/manual/replication/)
* [Deploy](https://docs.mongodb.com/manual/tutorial/deploy-replica-set/)


## Sharding

* https://docs.mongodb.com/manual/sharding/
* https://docs.mongodb.com/manual/tutorial/deploy-shard-cluster/
* https://www.youtube.com/watch?v=qYzYp1bPCPg
* https://docs.mongodb.com/manual/tutorial/deploy-sharded-cluster-hashed-sharding/#deploy-hashed-sharded-cluster-shard-collection

### Otras opciones:

* [How to generate random test data](https://farenda.com/mongodb/how-to-generate-random-test-data-in-mongodb/)
* https://github.com/feliixx/mgodatagen (Go)
* https://www.mockaroo.com/
* https://github.com/mongodb-labs/ipsum (Python)
