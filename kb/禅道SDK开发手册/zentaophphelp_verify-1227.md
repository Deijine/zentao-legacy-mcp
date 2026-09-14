# zentaoPHP框架中的数据验证机制 - zentaoPHP框架手册

数据验证在web应用中尤其显得重要。下面来给大家介绍下禅道框架的数据验证机制。 

#### 一、验证规则放在什么地方？
mvc程序中，每一层都可以放验证规则。比如很多的表单验证，会自动根据用户的输入进行验证，然后给予提示。那么数据验证放在哪一层呢？这个问题网络上大家有很多的争议。有的人主要放在view这一层，有的则主张放在control层。zentaoPHP选择了model层。 
为什么这样做呢？因为model层是底层，所有的数据操作，都要经过model来进行处理。那么只要在这一关把数据验证做好，就可以保证数据的准确和安全。当然，框架的用户，可以同时在前端加上js的验证，和model层的验证不会冲突的。下面来看下如何使用禅道的数据过滤机制。 

#### 二、zentaoPHP框架验证机制说明：
受php的filter机制启发，禅道的数据过滤分为两个部分，一个是数据修正，一个是数据验证。首先是要对从客户端传递过来的数据进行修正，然后再对数据进行校验。 
验证类是在lib/filter/filter.class.php里面定义的。 

#### 三、数据修正：
首先来看代码： 

```
$bug = fixer::input('post')
->add('openedBy', $this->app->user->account) 
->add('openedDate', $now) 
->setDefault('project,story,task', 0) 
->setDefault('openedBuild', '') 
->setIF($this->post->assignedTo != '', 'assignedDate', $now) 
->setIF($this->post->story != false, 'storyVersion', $this->loadModel('story')->getVersion($this->post->story))
->specialChars('title,steps,keyword') 
->cleanInt('product, module, severity') 
->join('openedBuild', ',') 
->remove('files, labels')
->get();
```

首先，是调用fixer这个类的input方法，它的参数post表示是从$_POST这个变量中获取数据。
 紧接着的两行add()，是向数据中增加两个变量。 
然后后面的两行setDefault则是表示，当这个变量没有传值的时候，设成默认的值。
 接下来是两行setIF。setIF共有三个参数，第一个是判断条件，后面两个分别是key和value。也就是当条件为true的时候，设置$key = $value。
 下面的spechialchars则表示对这三个字段进行htmlspecialchars处理;cleanInt则将变量处理成int类型，join，则将openedBuild使用,连接起来。
 最后，还需要把两个不需要的变量去掉，使用remove。
 通过get方法就可以得到一个已经经过修改的完整的数据集合。这个集合已经可以准备入库了。让我们来看下数据是如何验证的。 

#### 四、数据检查

```
$this->dao->insert(TABLE_BUG)->data($bug)
->autoCheck()
->batchCheck('id, name', 'notempty')
->exec();
```
 这句sql插入语句通过data方法，将修正过的数据传递给dao对象，然后通过autoCheck()对其进行自动检查。autoCheck会根据数据库里面字段的类型，长度进行判断。如果类型不对，或者长度不对，会自动记录错误。然后后面调用了batchCheck()方法，对一批字段进行非空的验证。
当然也可以通过check()方法对单个字段进行验证。验证的规则有很多，比如notempty, unique, email, account等等。 

#### 五、获得错误
如果数据验证过程中没有错误，则执行了exec()方法，将数据插入数据库。 
如果有错呢？exec()方法什么都不会执行，但会记录到错误日志中。可以在control中里面判断是否有错误。 

```
if(dao::isError()) die(js::error(dao::getError())); 
```

如果有错误，用js警告框的方式弹出，然后重置错误日志。 
![](http://www.zentaoms.com/js/jquery/kindeditor/plugins/emoticons/0.gif)

#### 六、数据修正和数据检查方法附录
数据修正方法： 

```
cleanEmail:    将目标字段处理为email
encodeURL：    将目标字段进行urlencode
cleanURL：     将目标字段中不符合url标准的字符去掉。
cleanFloat：   将目标字段处理为float类型。
cleanINT       将目标字段处理为int类型。
specialChars： 对目标字段使用htmlspecialchars处理。
stripTags：    去除目标字段中的标签。
quote：        对目标字段做quote处理。
setDefault：   对目标字段设置默认值。如果用户有传值，使用用户传的值。
setIF：        当满足某个条件的时候，对每个字段进行设置。
setForce：     强制覆盖某个字段的值。
remove：       删掉某一个字段。
removeIF：     满足某个条件的时候删除某一个字段。
add：          添加某一个字段。
addIF：        当满足某个条件的时候，添加某一个字段。
join：         对目标字段使用逗号连接起来。
callFunc:      使用自定义函数对数据进行修正。
```

数据检查方法： 

```
bool:     目标字段必须是布尔型。
int:      目标字段必须是int类型。
float:    目标字段必须是float类型。
email:    目标字段必须是email类型。
url:      目标字段必须是url 类型。
ip:       目标字段必须是ip地址。有一个可选参数：$range all|public|static|private
date：    目标字段必须是一个日期格式。
reg:      目标字段必须满足正则表达式。
length:   长度要满足指定的大小。
notEmpty: 目标字段不能为空。
empty:    目标字段必须为空。
account:  目标字段必须是一个合法的用户名。
equal:    目标字段必须等于某一个值。
call:     调用用户自己的检查函数。 

```
