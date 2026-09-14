# zentaoPHP框架里面的基本概念 - zentaoPHP框架手册

zentaoPHP框架的所有请求都是通过index.php来进行的。它的基本原理是通过设置apache或者其他webserver，将所有的请求都转交给index.php。index.php加载框架文件，初始化应用，然后分析请求，得到请求对应对模块名、方法和参数，然后加载相应模块的control方法，model方法，后渲染模板，展示给用户。基本的模型如下： 

![](https://static.zentao.net/web/data/upload/201408/f_87265a62709063bbc5dbf2a85e314a86.png)

#### 一、router
router在zentaoPHP框架中通常表现为index.php。通过apache的配置文件，将某一个域名下面所有的请求解析到这个index.php文件。然后由这个index.php来负责调度。 

#### 二、app
router会根据当前的请求来实例化一个具体的应用。比如demo应用的index.php代码如下： 

```
include './framework/router.class.php';
include './framework/control.class.php';
include './framework/model.class.php';
include './framework/helper.class.php';
$app = router::createApp('demo');
```

三、config, lang, dbh
当应用实例化之后，它会加载该应用的配置文件，生成$config对象。
 然后会连接到数据库，生成$dbh对象。
 然后会加载common模块的语言文件，生成$lang对象。 

#### 四、URI，module，control, model and view
当应用加载完配置文件和语言文件之后，它会解析当前的请求，也就是URI，得出要调用的模块及其方法、参数。 
module就是应用的一个模块。模块由control, model, view和lang文件组成。 
control是module的控制文件，由它来负责组织各种业务逻辑(model)，然后展示相应的视图(view)文件。 
比如demo应用里面的blog模块的control类，分别定义了index, view, del, edit, add等几个方法。 
相应的model类则定义了getList, getInfo, delArticle, add等几个方法。
