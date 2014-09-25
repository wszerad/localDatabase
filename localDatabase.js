//TODO turn loop sequences to reduce logical test (data loop>realtion loop to relation loop>data loop) (to speedup)

var Store = function(scheme, indexes){
	this.db = window.localStorage;

	this.records = 0;
	this.indexes = indexes;
	this.scheme = scheme;
	this.cache = {};
	this.indexCache = {};
	this.prefix = {
		data: 'd:',
		index: 'i:',
		cache: 'c:',
		records: 'r:'
	};

	this.register(scheme, indexes);
};

Store.prototype.getItem = function(key){
	return JSON.parse(this.db.getItem(key));
};

Store.prototype.setItem = function(key, value){
	return this.db.setItem(key, JSON.stringify(value));
};

Store.prototype.register = function(scheme, indexes){
	var content = null,
		self = this,
		records = self.db.getItem(self.prefix.records);

	if(records)
		self.records = parseInt(records);

	indexes.forEach(function(index){
		content = self.getItem(self.prefix.index + index);

		if(Array.isArray(index))
			return;

		if (!content)
			self.indexCache[index] = {};
		else
			self.indexCache[index] = content;
	});

	for (var i in scheme) {
		content = this.getItem(self.prefix.cache + i);

		if (!content)
			self.cache[i] = [];
		else
			self.cache[i] = content;
	}
};

Store.prototype.put = function(data){
	var self = this,
		changed = {},
		array = true,
		ret;

	if(!Array.isArray(data)) {
		data = [data];
		array = false;
	}

	ret = data.map(function(data) {
		var key, index, id, update, j;

		Object.keys(data).forEach(function(key){
			if(typeof data[key] === 'srting')
				data[key] = data[key].toLocaleUpperCase();
		});

		for (var i in self.scheme) {
			key = self.scheme[i];

			if (key == 'id') {
				id = data[i];
			} else {
				j = (typeof key === 'string')? key : i;

				index = self.cache[j].indexOf(data[i]);

				if (index === -1) {
					index = self.cache[j].length;
					self.cache[j].push(data[i]);
					changed[j] = true;
				}

				data[i] = index;
			}
		}

		if (id == null)
			id = self.records++;

		update = self.getItem(self.prefix.data + id);
		self.setItem(self.prefix.data + id, data);

		self.indexes.forEach(function (index) {
			var key = index;

			if(typeof index !== 'string'){
				key = index[1];
				index = index[0];
			}

			var indexCache = self.indexCache[key],
				newValue = data[index],
				upValue;

			if (update) {
				upValue = update[index];

				//TODO deep equal test for arrays or objects
				if (upValue === newValue)
					return;

				indexCache[upValue].splice(indexCache[upValue].indexOf(id), 1);
			}

			if (!indexCache[newValue])
				indexCache[newValue] = [id];
			else
				indexCache[newValue].push(id);
		});

		return id;
	});

	if(self.records)
		self.db.setItem(self.prefix.records, self.records);

	self.indexes.forEach(function (index) {
		if(!Array.isArray(index))
			self.setItem(self.prefix.index + index, self.indexCache[index]);
	});

	Object.keys(changed).forEach(function (name) {
		self.setItem(self.prefix.cache + name, self.cache[name]);
	});

	return array? ret : ret[0];
};

Store.prototype.getRaw = function(id, index, limit){
	var self = this;

	if (index) {
		var ind = self.cache[index].indexOf(id);

		if (ind==-1)
			return [];

		var ids = self.indexCache[index][ind],
			res = [];

		if (Array.isArray(ids)) {
			ids.some(function(id, index) {
				res.push(self.getItem(self.prefix.data + id));

				return (limit && limit===++index);
			});
		}

		return res;
	} else {
		return self.getItem(self.prefix.data + id);
	}
};

Store.prototype.get = function(id, index, limit){
	var self = this,
		ret = self.getRaw(id, index, limit);

	if(!index)
		ret = [ret];

	ret = ret.map(function(data){
		if(data===null)
			console.log(arguments);

		for(var i in self.scheme){
			var key = self.scheme[i],
				j;

			if(self.scheme[i]==='id')
				continue;

			j = (typeof key === 'string')? key : i;

			data[i] = self.cache[j][data[i]];
		}

		return data;
	});

	if(!index)
		return ret[0];
	else
		return ret;
};

Store.prototype.list = function(key, reg, limit){
	var ret = [],
		index = 0;

	this.cache[key].some(function(str){
		if(reg && reg.test(str)){
			index++;
			ret.push(str);
		}

		return (limit && limit===index);
	});

	return ret.sort();
};