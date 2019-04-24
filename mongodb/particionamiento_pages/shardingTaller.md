# Taller de Sharding

## Crear carpetas asociadas a los shards

Crear estas carpetas:

* ~/data/mongodb/sharding/shard1
* ~/data/mongodb/sharding/shard2
* ~/data/mongodb/sharding/shard3
* ~/data/mongodb/sharding/cfg1
* ~/data/mongodb/sharding/cfg2
* ~/data/mongodb/sharding/cfg3 

`~` es el equivalente al directorio del usuario (`/home/fernando` o `C:\Users\Fernando`), principalmente por un tema de permisos.

En cada una configurar desde Git Bash o la consola Linux los siguientes permisos

```bash
cd ~/data/mongodb/sharding
sudo chmod 775 shard* cfg*
sudo chown -R `id -un` shard* cfg*
```

## Levantar servers de configuración

```bash
mongod --configsvr --port 26050 --logpath ~/data/mongodb/sharding/log.cfg1 --logappend --dbpath ~/data/mongodb/sharding/cfg1 --fork

mongod --configsvr --port 26051 --logpath ~/data/mongodb/sharding/log.cfg2 --logappend --dbpath ~/data/mongodb/sharding/cfg2 --fork

mongod --configsvr --port 26052 --logpath ~/data/mongodb/sharding/log.cfg3 --logappend --dbpath ~/data/mongodb/sharding/cfg3 --fork
```

## Levantar shards (instancias de mongod)

```bash
mongod --shardsvr --replSet shard1 --dbpath ~/data/mongodb/sharding/shard1 --logpath ~/data/mongodb/sharding/log.shard1 --port 27000 --fork --logappend --smallfiles --oplogSize 50

mongod --shardsvr --replSet a --dbpath ~/data/mongodb/sharding/shard2 --logpath ~/data/mongodb/sharding/log.shard2 --port 27001 --fork --logappend --smallfiles --oplogSize 50

mongod --shardsvr --replSet a --dbpath ~/data/mongodb/sharding/shard3 --logpath ~/data/mongodb/sharding/log.shard3 --port 27002 --fork --logappend --smallfiles --oplogSize 50
```

## Levantando el servicio con replicación

Levantamos el shell de Mongo:

```bash
mongo shell
```

Ahora chequeamos la configuración, y si vemos que está deshabilitada:

```js
rs.conf()
2019-04-20T19:50:18.828-0300 E QUERY    [js] Error: Could not retrieve replica set config: {
	"ok" : 0,
	"errmsg" : "not running with --replSet",
	"code" : 76,
	"codeName" : "NoReplicationEnabled"
} 
```

Lo que vamos a hacer es detener el servicio de mongodb, y levantarlo con replicación:

```bash
sudo service mongod stop
mongod --dbpath ~/data/mongodb/shard1 --replSet "shard1" --port 27058 --smallfiles --oplogSize 50
```

Salimos de la sesión anterior de mongo shell, escribiendo `exit` y luego volvemos a ingresar, y preguntamos nuevamente:

```js
rs.conf()
2019-04-20T19:57:24.907-0300 E QUERY    [js] Error: Could not retrieve replica set config: {
	"operationTime" : Timestamp(0, 0),
	"ok" : 0,
	"errmsg" : "no replset config has been received",
	"code" : 94,
	"codeName" : "NotYetInitialized",
	"$clusterTime" : {
		"clusterTime" : Timestamp(0, 0),
		"signature" : {
			"hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
			"keyId" : NumberLong(0)
		}
	}
} :
```

## Iniciar replicación

## Links

- http://juanroy.es/es/how-to-set-up-a-mongodb-sharded-cluster/
- https://www.bit.es/knowledge-center/mongodb-para-big-data-replicacion-y-sharding-iii/
- https://medium.com/@tudip/mongodb-sharding-replication-and-clusters-d95a6595bd2c