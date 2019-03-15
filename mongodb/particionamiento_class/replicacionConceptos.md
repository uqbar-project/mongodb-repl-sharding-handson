# Replicación

![image](../images/replicacionBase.svg)

La replicación consiste en tener copias o _réplicas_ de una base de datos original. En la base de datos MongoDB esto se implementa con varios procesos:

* un proceso **mongod** central o nodo primario que procesa las actualizaciones y mantiene los documentos actualizados. A su vez en segundo plano (_background_) se genera un log con las novedades para...
* ...los otros procesos **mondod** que actúan como _replica set_ o nodos secundarios, reciben ese log y actualizan la misma información.

Nosotros podemos conectarnos con un cliente (proceso **mongo**) a cualquiera de los nodos, pero **solo podremos insertar, actualizar o eliminar documentos en el nodo primario**.

## Objetivo principal


## Links útiles

* [Replicación - Manuales de MongoDB](https://docs.mongodb.com/manual/replication/)
