# 找到要修改的文件

要想对禅道进行修改，就必须知道对应的代码在什么地方。在了解了禅道的目录结构之后，我们来看下禅道的请求是如何对应到代码的。 

#### 一、control方法的定位
control方法是每一个页面的入口，顺藤摸瓜，让我们先来看个例子：bug-browse-1.html 或者是/?m=bug&f=browse&productID=1&t=html。这里面有什么玄机呢？让我们来揭晓。 
bug-browse-1.html，表示是访问bug这个模块的browse方法，传递的第一个参数为1，访问的页面类型是html。
 同样,/?m=bug&f=browse&productID=1&t=html,m代表了模块名称，f代表了方法名称，后面的则是参数列表。
 那么我们就可以对应到禅道的源代码，module/bug/control.php中的browse方法：

![](https://static.zentao.net/web/data/upload/20100827151538_99658.gif)

#### 二、control方法里面的调用
ok，我们现在已经知道了入口的函数在什么地方，我们来跟到里面看看吧。 
$this->bug，表示的是调用bug模块的model对象，那么它对应的文件在什么地方呢？聪明的你，应该已经猜到了吧。在module/bug/model.php
this->loadmoel('tree')->xxx，表示加载tree模块的model对象，它对应的文件在module/tree/model.php
 $this->app->loadClass('pager'),表示加载一个lib类，它对应的文件则在lib/pager/pager.class.php
 $this->lang->bug->xxx，它的定义在module/bug/lang/zh-cn.php。后面的zh-cn根据当前用户的语言而定。 
后来看模块文件。$this->display()之后，调用的是view目录下面和当前方法同名的模板文件。比如bug的browse方法，它对应的模板文件是module/bug/view/browse.html.php
