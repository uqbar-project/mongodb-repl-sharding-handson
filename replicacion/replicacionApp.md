# Integración de una app con un esquema de replicación en MongoDB

Asumiendo que [ya tenés configuradas tus instancias de MongoDB según el taller](./replicacionTaller.md), aprovecharemos el nodo árbitro que creamos previamente. Tomaremos como ejemplo base la aplicación de [préstamo de libros](https://github.com/uqbar-project/eg-libros-springboot-mongo-kotlin).

# Levantando un árbitro

Agregaremos un árbitro al replica set existente:

```bash
# nos conectamos al nodo principal
docker exec -it mongo1 bash
mongosh
```

Y generamos una nueva instancia:

```js
// es necesario avisarle a mongo que vamos a hacer cambios
db.adminCommand({
  "setDefaultRWConcern" : 1,
  "defaultWriteConcern" : {
    "w" : 2
  }
});

// ahora sí podemos agregar la instancia
rs.addArb("172.16.238.13:27017");
```

Pueden ejecutar el comando `rs.conf()` para confirmar que se levantó la instancia:

```js
   ...,
   {
      _id: 4,
      host: '172.16.238.13:27017',
      arbiterOnly: true,
```


Levantaremos ahora la aplicación en IntelliJ utilizando como environment `replica`. Para eso activamos el menú Run > Edit Configuration y generamos una copia de la configuración que ejecuta la aplicación LibrosApplication:

![Copy configuration](../images/replication/intellij-run-copy-config.png)

La configuración base se crea cuando activás el botón play en el método `main` de la clase `LibrosApplication`. El nuevo contexto de ejecución de la aplicación solo tendrá como dato diferente el valor `replica` para `Active Profiles`:

![Levantando App Replicación en IntelliJ](../images/replication/intellij-run-replica-env.png)

Eso permite que tome información del archivo `application-replica.yml`, donde definimos un origen de datos que se conecta al esquema de replicación:

```yml
# base documental
spring:
  data:
    mongodb:
      uri: mongodb://admin:admin@172.16.238.10:27017,172.16.238.11:27017,172.16.238.12:27017/libros?authSource=admin&replicaSet=dbrs
...
```

El formato que tiene el data source es:

- mongodb: el driver
- usuario:password
- una lista de IPs/puertos, que son los que tuvimos que definir en el archivo [docker-compose.yml](./docker-compose.yml) y que deben coincidir con los que [definimos en el replicaset](./rs-init.sh) o de lo contrario Springboot los eliminaría
- la base de datos luego de la barra `/`, en este caso es libros
- como datos adicionales: el authentication source que es la base de datos donde está definido el usuario admin (que es admin)...
- ... y el nombre del replicaset: dbrs

### Replicación en marcha

Veamos que cuando vamos actualizando la información eso se ve reflejado en las réplicas:

![Devolución del préstamo se refleja en las réplicas](../images/replication/update-app-replica-2.gif)

Para notar que es una réplica, fíjense que no nos deja eliminar un documento:

![Eliminar en una réplica tira error](../images/replication/replica-deleting-failure.gif)


## Cambiando el nodo primario

Parados en la instancia primaria, en la consola de Mongo, vamos a decir que declinamos ser el nodo primario:

```js
rs.stepDown()
```

Otra opción más violenta es hacer kill del proceso, o ingresar y bajar el proceso

```bash
# nos conectamos al nodo principal
docker exec -it mongo1 bash
mongosh
```

```js
use admin
db.shutdownServer()
```

Veamos ahora el nuevo estado de nuestro set de réplicas desde algún otro nodo:

```js
rs.status()
```

Aquí veremos cuál es nuestro nuevo nodo primario (elegido por el nodo árbitro), sabremos además que la anterior instancia primaria es ahora **secundaria**:

```js
	"members" : [
		{
			"_id" : 0,
			"name": '172.16.238.10:27017',
			"health" : 1,
			"state" : 2,
			"stateStr" : "SECONDARY",
```


## Prueba de la app con el nuevo nodo primario

Como nuestra aplicación utiliza un data source basado en un set de réplicas, solo basta enviar la información y el nodo primario se encarga de actualizar el documento, replicando luego al resto de los nodos secundarios:

![](../../images/replicacion/replica-primary-secondary.gif)

- no es necesario restartear nada
- la instancia mongo1 se cae, en ese interín deja de estar disponible como nodo secundario
- el árbitro elige una nueva instancia como nodo primario (en este caso mongo2)
- cuando vuelve a iniciarse mongo1, el árbitro le vuelve a pasar la responsabilidad de ser el nodo primario (al final del video)

En los logs vemos cómo fue el paso de un container hacia otro:

```bash
...
Discovered replica set primary 172.16.238.11:27017 with max election id 7fffffff0000000000000008 and max set version 2
...
com.mongodb.MongoNodeIsRecoveringException: Command failed with error 91 (ShutdownInProgress): 'The server is in quiesce mode and will shut down' on server 172.16.238.10:27017. The full response is {"topologyVersion": {"processId": {"$oid": "64557fcf20283a833be6a3d2"}, "counter": 12}, "ok": 0.0, "errmsg": "The server is in quiesce mode and will shut down", "code": 91, "codeName": "ShutdownInProgress", "remainingQuiesceTimeMillis": 8969, "$clusterTime": {"clusterTime": {"$timestamp": {"t": 1683325017, "i": 2}}, "signature": {"hash": {"$binary": {"base64": "AAAAAAAAAAAAAAAAAAAAAAAAAAA=", "subType": "00"}}, "keyId": 0}}, "operationTime": {"$timestamp": {"t": 1683325017, "i": 2}}}
...
Execution of command with request id 150 completed successfully in 0.55 ms on connection [connectionId{localValue:8, serverValue:12}] to server 172.16.238.13:27017
Execution of command with request id 151 completed successfully in 0.56 ms on connection [connectionId{localValue:2, serverValue:23}] to server 172.16.238.12:27017
Execution of command with request id 152 completed successfully in 0.42 ms on connection [connectionId{localValue:6, serverValue:21}] to server 172.16.238.11:27017
```

Lo que ocurre dentro del backend no se ve reflejado en la aplicación que sigue ejecutándose normalmente.

## Resumen arquitectura

![](../images/replication/replica-set-mongodb-app.png)