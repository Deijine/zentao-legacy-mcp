# 禅道项目管理软件打包规范1.1版本

大家在二次开发过程中，好的功能也可以打包成插件和大家进行分享。我们整理了禅道项目管理软件打包规范。 

####  一、可以扩展的元素： 

|  
 目录  
 说明 
|  
 bin  
 比如新增的命令行脚本程序。 
|  
 config  
 比如可以对配置文件进行修改。 
|  
 db  
 db目录下面可以存放install.sql和uninstall.sql，分别对应安装时需要执行的sql脚本和卸载时需要执行的sql脚本。 
|  
 doc  
 这个插件相关的文档。 
|  
 lib  
 可以新增某一个类，或者对现有的类进行修改。 
|  
 extension/custom  
 可以新增某一个模块，也可以对现有的模块进行功能扩展。 
|  
 www  
 可以发布自己的风格。也可以对js文件进行修改。 

#### 

#### 

#### 

#### 

#### 

#### 

#### 

####  二、doc目录应当包含的文档  doc目录下面包含了插件的配置信息，按照语言进行存储，比如英文版本的，存为en.yaml，中文zh-cn.yaml
 插件的配置文件采用yaml格式，里面包含了插件的基本信息以及历次版本的发布信息。共分为下面的信息： 

![](https://static.zentao.net/web/data/upload/201201/0417342903677ea1.jpg)

 可以参考：http://www.zentao.net/extension-viewExt-1-info-front.html (/extension-viewExt-1-info-front.html)

####  三、db目录下面包含的文件： 
 db目录下面可以包含install.sql和uninstall.sql。顾名思义,install.sql是当安装插件的时候执行的sql语句，而uninstall.sql则是当卸载插件的时候需要执行的sql语句。这样如果你的插件涉及到数据库的改动，可以将相应的sql语句放在这两个文件中，禅道的插件管理程序会自动来执行。 

####  四、extension/custom下面的文件： 
 extension/custom目录下面的文件，就按照我们的插件扩展机制 (http://devel.easycorp.cn/book/extension/extend-model-38.html) 部署相应的目录结构就可以了。 

####  五、主配置文件的扩展 
 在实际过程中，可能会需要对全局的配置文件进行扩展，这种情况将扩展的配置文件放在zentao/config/ext/下面就可以了。 

####  六、安装和删除的钩子脚本 
 如果在安装之前，安装之后，卸载之前，卸载之后需要执行一些操作，可以建立一个hook目录，然后分别在里面创建preinstall.php, postinstall.php, preuninstall.php, postuninstall.php，里面放上你所需要的代码即可。 

####  七、小结：创建自己的插件： 
-  确定插件的英文名，比如叫做hello。 
-  创建hello目录。 
-  在hello目录下面创建doc目录。 
-  在doc目录下面创建配置文件yaml文件： 
-  如果有涉及到数据库的改动，在hello目录下面创建db目录，分别写好install.sql和uninstall.sql 
-  如果需要钩子脚本，创建hook目录，创建 preinstall.php, postinstall.php, preuninstall.php, postuninstall.php。 
-  然后部署相应的扩展代码。在hello目录下面创建一个extension/custom目录，然后将相应的模块扩展代码放在extension/custom下面。 
-  打包，使用zip格式将整个hello目录打包成hello.zip，就可以了。 

####  八、查看示例： 
 请看我们示例：http://www.zentao.net/extension-viewExt-1.html (http://www.zentao.net/extension-viewExt-1.html)
