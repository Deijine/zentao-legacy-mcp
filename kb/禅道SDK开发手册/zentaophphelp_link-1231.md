# 如何生成链接 - zentaoPHP框架手册

因为zentaoPHP框架有两种运行方式，所以在生成链接的时候，尽量不要手工拼写链接代码，通过调用系统提供的createLink方法，来生成链接。 

#### 一、$this->createLink()方法
比如，我们要生成一个blog模块的view方法的链接，需要传递参数为id=17，这样来调用： 

echo $this->createLink('blog', 'view', 'id=17&cat=123')
第一个参数是模块名称，第二个参数是方法名，第三个参数是参数，使用key1=value1&key2=value2这种方式来进行传参。 
如果运行方式为PATH_INFO，这样会生成 blog-view-17-123.html这样的链接。
 如果运行方式为GET，则生成?m=blog&f=view&id=17&cat=123&t=html的链接。 

#### 二、helper::createLink()方法
$this->createLink()方法，是可以在control和view里面直接调用的。如果需要在其他地方调用，则可以使用helper::createLink()，参数是一样的。 

#### 三、JS版本的createLink()方法
另外，我们还提供了一个js版本的createLink()函数，用来在js交互中生成一些链接。具体的代码，可以参考app/demo/www/js/my.js里面的定义。 
不过在调用js版本的createLink()之前，需要调用下js::exportVars()方法，来输出下当前系统的配置参数。 

![](https://static.zentao.net/web/data/upload/201105/2813514001104cd1.gif)
