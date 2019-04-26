# Sharding

El sharding consiste en distribuir la información en varias máquinas. El particionamiento permite el **escalamiento horizontal**, donde al dividir grandes volúmenes de datos en particiones más chicas no necesitamos máquinas tan poderosas para resolver consultas (ya que tenemos menos datos para procesar). En contraposición, debemos tener ciertos recaudos en la configuración del sharding, como veremos más adelante.

## Diagrama general de la solución con sharding

![](../../images/sharding/sharding-01-base.png)

### Shards y chunks

El cluster entero se divide en **shards**, cada uno de estos shards levanta un proceso `mongod` como un **replicaSet**. Los shards pueden estar en diferentes máquinas, o bien en la misma máquina y diferentes puertos. Con la unión de todos los shards tendremos la totalidad de los documentos que forman la base. Dentro de cada shard, los documentos se agrupan en **chunks**, que por defecto ocupa 64 MB.

### Routers para consultas o actualizaciones, shard keys

La aplicación cliente (ya sea `mongo` o un driver) no se conecta directamente al proceso `mongod` del shard, sino al proceso `mongos` que actúa como router para redirigir las consultas o actualizaciones hacia un shard específico. Para ello necesitamos definir la clave de particionamiento o **shard key** con el que vamos a saber a qué shard le corresponde cada documento.

#### Ranged keys

#### Hashed keys

#### Zones

### Splitter y balancer

, entonces periódicamente corren dos procesos de fondo: el **splitter** que verifica que un nuevo documento insertado no lleve al chunk a exceder de su límite, en cuyo caso se parte el chunk en dos:

![](../../images/sharding/sharding-splitting.svg)

Por otra parte, la creación de nuevos chunks puede llevar a que un shard tenga muchos más datos que otro, por eso un segundo proceso llamado **balancer** se encarga de mantener uniformes los chunks.

![](../../images/sharding/sharding-migrating.svg)


https://www.youtube.com/watch?v=W3HhqMvwZP8

## Material

* https://docs.mongodb.com/manual/sharding/
* https://docs.mongodb.com/manual/tutorial/deploy-shard-cluster/
* https://www.youtube.com/watch?v=qYzYp1bPCPg
* https://docs.mongodb.com/manual/tutorial/deploy-sharded-cluster-hashed-sharding/#deploy-hashed-sharded-cluster-shard-collection