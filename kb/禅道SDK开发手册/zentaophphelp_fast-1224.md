# 简单的Hello world! - zentaoPHP框架手册

安装好框架之后，让我们来用框架来实现helloworld! 我们以框架代码部署在/var/www/zentaophp为例： 

#### 一、了解框架目录结构

 新版本的框架对目录结构进行了简化。解压缩zentaoPHP框架之后，你可以看到这个目录下面有如下文件： 

![](https://static.zentao.net/web/data/upload/201408/f_2b9b36e46714f12ed815b609600ceb67.png)

 其中config目录存储配置文件。 
 db目录存储的是demo演示所用的blog表的定义。 
 favicon.ico是网站小图标文件。 
 framework则是框架的核心目录，里面包含了router, control, model和helper的定义文件。 
 index.php是入口程序，所有的请求都经由index.php来进行转发。 
 js目录用来存放js脚本文件。 
 lib目录用来存放常用的类文件。 
 module则是模块目录，所有的功能模块都放在这个目录下面。 
 theme则用来放样式表和图片文件。 

#### 二、创建hello模块
下面我们在module目录创建hello模块。

```
cd module
mkdir hello

```

#### 【重要提示】新增加的模块名和control层的文件名必须使用小写命名。

#### 三、创建control.php文件。
 在hello目录下面生成一个control.php文件，里面写入下面的代码： 

```
<?php
class hello extends control
{
    public function world()
    {   
        echo 'Hello, world!';
    }
}
?>
```

#### 四、访问helloworld应用：

这时用浏览器访问：http://localhost/zentaophp/hello-world，就可以看到hellworld了。
如果config/my.php配置的访问方式是GET方式，访问路径是http://localhost/zentaophp/?m=hello&f=world.
