Simple localStorage handle with auto JSON parsing and relations. 
===

### Usage:

```js
var db = new Store({
	id: 'id',	//if not given, auto increment
	name: true,
	city: true
}, ['name']);

db.put({id: 0, name: 'John', city: 'London', code: 345});	=> 1 //id
db.put({id: 1, name: 'Alex', city: 'London', code: 346});	=> 2 //id
db.put({id: 5, name: 'Alex', city: 'New York', code: 634});	=> 5 //id

db.getRaw(1)	=> {id: 1, name: 1, city: 0, code: 346}
db.get(1)		=> {id: 1, name: 'Alex', city: 'London', code: 346}

db.get('Alex', 'name') 		=> [{id: 1, name: 'Alex', city: 'London', code: 346}, {id: 5, name: 'Alex', city: 'New York', code: 634}]
gb.get('Alex', 'name', 1) 	=> [{id: 1, name: 'Alex', city: 'London', code: 346}]
db.get('London', 'city')	=>	[]	//city is not indexed (second parameter of Store constructor)

db.list('name', /.*/, 1)	=> ['John'] //third parameter is limit
db.list('name', /A.*/, 1)	=> ['Alex']	
```

### Usage example:

We have actor search with auto completion of names using 

```js
//on keyup
names = db.list('name', new RegExp('^' + searchTextt) , 20)
//show names...
```

When we complete name we can easily find all actors with given name by 

```js
//on 'enter' keyup
db.get('Alex', 'name')
//show actors...
```