# zentaoPHP框架提供的DAO功能 - zentaoPHP框架手册

#### 一、关于DAO的说明
zentaoPHP并没有试着去实现ORM或者ActiveRecord这样的概念。因为我们相信，框架要留给开发人员足够的自由发挥的空间，而不是所有的都要包办。所以框架里面提供了一个简单方便的数据库访问对象类DAO。并且我们在封装DAO的时候尽可能的兼容标准的sql写法。 
DAO类的定义在lib下面的dao.class.php中。框架在加载的时候，会自动生成$this->dao对象，可以在control, model或者view层的代码中直接使用$this->dao来执行各种方法。 

#### 二、执行方法的区别
如果是查询类的语句，需要使用fetch系列的方法来返回数据。更新，删除，替换这些方法可以使用exec()方法。 
DAO在后执行的时候，有下面的方法： 

```
fetch():         获得满足条件的第一次记录，返回的是对象格式。
fetch($filed)：  获得满足条件的第一个记录的字段$field对应的值。
fetchAll()：     获得满足条件的所有记录，以数组格式返回，索引为0-n
fetchAll($key):  获得满足条件的所有记录，并使用字段$key作为索引值。
fetchPairs($key, $value)： 返回键值对的列表。如果不指定参数，则取返回记录中的第一个字段作为key，第二个字段作为value。
fetchGroup($group, $key)： 把满足条件的记录按照$group字段进行分组。比如把所有$status=active的放在一起。

```

#### 三、操作符说明
为了书写的方便，DAO类里面封装了若干操作符： 

```
eq: equal，等于
ne: not equal，不等于
gt: great than, 大于
lt: little than, 小于
in: 介于一个列表中。
between: 在一个区间中。
notin：不在一个列表中。
like: 模糊匹配。

```

#### 四、查询语句：
普通的查询：查询account=wwccss的记录。 

```
$this->dao->select('*')
->from('user')
->where('account')
->eq('wwccss')
->fetch();

```
 再复杂一点，加入andWhere (或者orWhere) 

```
$this->dao->select('*')->from('user')
->where('id')->gt(10)
->andWhere('age')->lt(20)
->orderBy('id desc')
->limit('1,10')
->fetchAll()

```

左连接查询 

```
$this->dao->select('t1.*, t2.*')->from('user')->alias('t1')->leftJoin('userGroup')->alias('t2')->on('t1.account = t2.account')->fetchAll();
```
 其他便利的方法：

```
$this->dao->findByAccount($account)->from('user')->fetch();               // 魔术方法，按照account进行查询。
$this->dao->select('*')->from('user')->fetchAll('account');              // 返回的结果中，以account为key。
$this->dao->select('account, realname')->from('user')->fetchPairs();     // 返回account=>realname的键值对。
$this->dao->select('class, account, realname')->from('user')->fetchGroup('class');     // 按照所属的class进行分组

```
 根据条件拼装SQL：beginIF, FI()

```
$this->dao->select('*')->from('user')->where('id')->gt(10)->beginIF($class == 'online')->andWhere('status')->eq('online')->fi()->fetchAll();
```

#### 五、插入语句：
使用一个data对象来更新。data对象的key对应到数据表中字段名。 

```
$user->account = 'wwccss';
$user->password = '123456';
$this->dao->insert('user')->data($user)->exec();
```

或者一个字段一个字段更新： 

```
$this->dao->insert('user')
->set('account')->eq($account)
->set('password')->eq($password)
->exec();
```

获得后插入的记录id 

```
echo $this->dao->lastInsertID();
```

#### 六、更新语句：
更新语句和insert基本类似，可以使用一个data对象或者单个字段进行更新。 

```
$user->name = 'wwccss';
$user->age = 10;
$this->dao->update('user')->data($user)->where('id')->eq($userid)->limit(1)->exec(); 
$this->dao->update('user')
->set('account')->eq($account)
->set('password')->eq($password)
->exec()
```

#### 七、REPLACE语句
replace也是需要定义一个data对象，然后调用replace方法。需要注意的是replace要保证表有主键或者唯一索引。 

```
$this->dao->replace('user')->data($user)->exec();
```

#### 八、删除语句：

```
$this->dao->delete()->from('user')->where('id')->eq($userid)->exec();

```
