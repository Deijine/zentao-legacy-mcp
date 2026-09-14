# zentaoPHP目录结构 - zentaoPHP框架手册

目录结构对于一个框架来讲是比较重要的。我们一起来看一下ZenTaoPHP的目录结构。 

#### 一、顶级目录结构

```
config：           配置文件所在的目录。包含了config.php和my.php
db：               demo应用所需要的blog.sql
framework：        包含了框架的核心文件。
js：               包含了js脚本文件。
lib：              包含了常用的类文件。 
module：           模块目录，每个模块一个目录，存放在module目录下面。
extension：        扩展目录，二次开发的代码，扩展module的功能。
theme：            主题文件，包含了css文件和图片文件。
.htaccess：        apache下面使用的url重写规则文件。
favicon.ico：      小图标文件。
index.php：       入口程序。
```

### 二、具体到一个模块的目录结构

```
config.php:  这个模块的配置文件，可以用来存放专门针对这个模块的配置，也可以覆盖全局性的配置。
lang:        存放各个语言的文件。比如中文存为zh-cn.php，英语存为en.php，繁体存为zh-tw.php。
control.php  为这个模块对应的控制器类文件。
model.php    为这个模块对应的业务逻辑类文件。
view：       存放的各个方法的视图文件。比如index.html.php是index方法的模板文件 
```

common模块需要特殊说明一下： common模块里面存储的是当前这个应用公用的语言文件、模板文件、model文件等。 比如lang/zh-ch.php将存储一些公用的语言文件。 header.html.php是模板公用的头文件。 footer.html.php是模板公用的页脚文件。 error.html.php则是公用的出错信息提示的模板文件
