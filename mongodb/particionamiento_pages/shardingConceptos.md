# Sharding

El sharding consiste en distribuir la información en varias máquinas. El particionamiento permite el **escalamiento horizontal**, donde al dividir grandes volúmenes de datos en particiones más chicas no necesitamos máquinas tan poderosas para resolver consultas (ya que tenemos menos datos para procesar). En contraposición, debemos tener ciertos recaudos en la configuración del sharding, como veremos más adelante.

## Diagrama general de la solución con sharding

![](../../images/sharding/sharding-01-base.png)

### Shards

El cluster entero se divide en **shards**, cada uno de estos shards levanta un proceso `mongod` como un **replicaSet**. Los shards pueden estar en diferentes máquinas, o bien en la misma máquina y diferentes puertos. Con la unión de todos los shards tendremos la totalidad de los documentos que forman la base.

### Chunks y shard keys

Cada shard tiene un conjunto de **chunks** de 64 MB (aunque el tamaño se puede configurar). Los chunks agrupan documentos de similares características en base a la definición de la **shard key** o clave de particionamiento. Por ejemplo, en una base de alumnos de la facultad, una _shard key_ posible es el dígito verificador del legajo, otra el sexo, otra posibilidad es agrupar por año de nacimiento, otra por carrera y dígito verificador del legajo.

Para elegir una shard key, hay tres cosas fundamentales que debemos tener en cuenta:

- **alta cardinalidad** (_high cardinality_): la cardinalidad determina la cantidad máxima de chunks que podemos crear, dado que todos los documentos que tienen la misma shard key deben estar en el mismo chunk. Elegir una shard key en base al sexo de los alumnos produciría una situación como la siguiente:

![](../../images/sharding/sharding-02-low-cardinality.png)

> Incorporar más shards al cluster no tendría efecto, dado que nuestra clave tiene cardinalidad 3 que es menor a la cantidad de shards instalados. Por lo general, una shard key que produce menos de 50 valores se considera de **baja cardinalidad.**

Lo mismo ocurre con una clave que trabaja en base al dígito verificador del alumno, ya que tendremos solamente 10 chunks para distribuir en cada uno de nuestros shards. Una clave basada en el legajo tiene alta cardinalidad: entonces podemos agruparlos en chunks más pequeños y ajustar el tamaño de los chunks cuando un chunk ocupe más de 64 MB (o el valor que nosotros definamos).

- **baja frecuencia** (low frequency): se refiere a la probabilidad de ocurrencia o repetición de una clave, y está directamente relacionado con la cardinalidad. Una shard key de alumnos basada en el sexo, tiene una alta frecuencia. Una shard key basada en el legajo tiene una baja frecuencia, lo mismo que la clave basada en el apellido.

- **crecimiento uniforme en el tiempo** (non-monotonically changing in value): en el caso de una shard key basada en el dígito verificador tendremos una distribución proporcional de documentos en cada uno de los chunks. En el caso de una shard key basada en la carrera de un alumno, si tenemos carreras con pocas matrículas y otras con muy alta cantidad de inscriptos, esto no asegura un crecimiento uniforme en el tiempo. Para poder profundizar en este aspecto, necesitamos diferenciar distintos tipos de shard keys.

#### Ranged sharded keys

![](../../images/sharding/sharding-03-ranged-sharding.png)

#### Hashed sharded keys

## Routers

La aplicación cliente (ya sea `mongo` o un driver) no se conecta directamente al proceso `mongod` del shard, sino al proceso `mongos` que actúa como router para redirigir las consultas o actualizaciones hacia un shard específico.

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