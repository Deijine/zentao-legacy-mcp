# 对控制层(control/zen)扩展

## 一、控制层control
 对现有模块的control层的扩展有两种，一种是覆盖现有的方法，一种是增加新的方法。下面我们来看下如何进行扩展。 

#####  文件命名规则 
 无论是覆盖现有的方法，还是新增方法，扩展文件都是以方法名为名，保存到ext/control目录下面。文件名都是小写。 
 比如以user模块为例，我们想重新定义它的注册逻辑，只需要在extension/custom/user/ext/control下面创建register.php，然后实现代码即可。 
 如果我们想为user模块增加一个开放登录功能，比如叫做oauth，只需要在extension/custom/user/ext/control下面创建oauth.php，然后实现代码即可。 

#####  独立扩展代码 
 在对control层进行扩展的时候，可以完全独立，也可以重用主干代码在control里面定义的方法。下面的例子是完全的独立的。 

```
class user extends control
{
    public function register()
    {
        $this->view->header->title = 'getsid';
        $this->view->sid = session_id();
        $this->view->test = $this->misc->test();
        $this->display();
    }
} 
```
请大家注意类名的定义：user，从control基类派生而来。这样的定义是完全独立的。

#####  继承扩展
上面的例子是独立的扩展，但很多时候还想重用禅道原来的代码，则可以通过继承扩展的方式来实现。

```
class myUser extends user
{
    public function register()
   {
        ....
        $this->process()    // process方法是在../../control.php里面定义
   }
}
```

 继承的user类已经使用autoload自动加载到内存中，只需要定义类名myUser(my + 模块名)，从user类派生而来，这样就可以在register方法里面调用父类user的process方法。 

## 二、控制子层zen
 zen层方法的扩展相对比较容易，只需要定义方法就可以。如果该方法已经在模块中定义过就会覆盖，如果之前没有定义过就是新增。 
 新增 extension/custom/user/ext/zen/xxx.php，其中 xxx.php为插件名。 

```
protected function getTodoList()
{
    return $this->user->getTodoList();
}
```

需要说明的是这里面的定义不包含类的声明，就只是一个方法的声明。

 control层同样可以通过 $this->userZen->getTodoList(); 进行调用。 

#####  四、限制 
 由于框架加载机制的限制，control一个方法只能有一个扩展。
