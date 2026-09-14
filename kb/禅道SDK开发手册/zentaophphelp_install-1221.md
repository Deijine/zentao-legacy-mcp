# zentaoPHP框架安装 - zentaoPHP框架手册

#### 一、安装apache, mysql, php的运行环境
首先要确认你的机器上面已经安装好了apache, mysql, php的运行环境。而且符合zentaoPHP框架的系统要求 (http://devel.zentao.net/help-read-78489.html)。 

#### 二、获取新的zentaoPHP框架
从devel.easycorp.cn (/)下载新的zentaoPHP框架。目前是以zip格式提供的。 

#### 三、安装zentaoPHP框架
将下载下来的zip文件解压缩到一个目录，比如/var/www/zentaophp。 
解压之后，里面有一个framework, module, lib的目录。其中你要开发的应用程序要放在module目录下面。 

#### 四、建立demo数据库
在体验框架之前，需要先创建一个demo数据库。可以使用phpmyadmin或者mysql的命令行来创建这个数据库。 
然后到db目录，找到blog.sql文件，生成blog表。 

#### 五、生成配置文件
到config目录下面，把my.example.php复制一份，复制成my.php，修改里面的数据库的访问参数。 

```
<?php
$config->installed    = true;
$config->debug        = true;  
$config->requestType  = 'PATH_INFO';    // PATH_INFO or GET.
$config->requestFix   = '-';
$config->webRoot      = '/'; 
$config->db->host     = 'localhost';
$config->db->port     = '3306';
$config->db->name     = 'demo'; 
$config->db->user     = 'root'; 
$config->db->password = '';
```

主要要修改host, port, name, user, password这些参数。 

#### 六、访问demo应用
通过浏览器访问：http://localhost/zentaophp/，就可以看到框架运行的欢迎界面了。 
![](https://static.zentao.net/web/data/upload/201408/f_38337e470d0096a05cd2420f2e87f4d7.png)

备注：访问路径根据你实际的部署目录来加以修改。localhost也根据需要换成实际的ip地址或者域名。
