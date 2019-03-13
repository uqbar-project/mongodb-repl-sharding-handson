# Generadores de datos random para MongoDB

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

## Links

* [Volver a Particionamiento en MongoDB](../particionamiento.md)