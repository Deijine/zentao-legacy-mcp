# 对多语言和配置进行扩展

####  一、语言的扩展 
 zentaoPHP框架把所有页面提示都已经抽象成语言配置，可以通过对语言的重定义来实现对程序的定制修改。 
 语言的扩展文件存放在ext/lang/目录下面。按照不同的语言建立相应的目录，比如zh-cn下面，可以有多个文件，zentaoPHP框架会自动加载该目录下面所有以.php结尾的文件。 
 比如扩展bug模块的语言文件，可以建立extension/custom/bug/ext/lang/zh-cn/1.php。 

####  二、配置的扩展 
 2.1 模块配置的扩展 
 每个模块配置文件的扩展文件存放在 ext/config/ 目录下面，可以有多个文件，zentaoPHP框架会自动加载该目录下面的 .php 文件。这样不同的扩展可以有自己的配置项，彼此之间不会冲突。 

 2.2 全局配置的扩展 
 全局配置文件存放在框架基础目录的config目录下面，不建议直接修改config.php文件，可以在同目录下的my.php中修改，因为config会自动载入my.php文件中的内容。如果相对全局的配置进行扩展，也可以参考禅道等产品的扩展方式，将扩展文件存放在config/ext/目录下面，在禅道的conifg.php文件底部你可以看到下面代码： 

```
/* Include extension config files. */
$extConfigFiles = glob(dirname(__FILE__) . DIRECTORY_SEPARATOR . 'ext/*.php');
if($extConfigFiles) foreach($extConfigFiles as $extConfigFile) include $extConfigFile;
```
