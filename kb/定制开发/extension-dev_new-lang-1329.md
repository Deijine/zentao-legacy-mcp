# 新增语言项lang和配置项config

####  一、新增语言项 
 禅道将所有页面显示的内容都已经抽象成语言配置，可以通过对语言的定义来实现对程序的定制修改。 
 我们显示一个文字内容，比如 “创建待办” 我们可以在语言项定义 

```
$lang->oa->createTodo = '创建待办';
```

 语言的扩展文件存放在lang/目录下面。按照不同的语言建立相应的文件，中文简体对应的文件名是 zh-cn.php。 
 比如oa模块的中文简体语言文件是 extension/custom/oa/lang/zh-cn.php。 

####  二、配置的扩展 
 2.1 模块配置的扩展 
 每个模块的配置信息都放在 config.php 中，比如oa模块的配置文件在 extension/custom/oa/config.php。 

 2.2 全局配置的扩展 
 全局配置文件存放在框架基础目录的config目录下面，不建议直接修改config.php文件，可以在同目录下的my.php中修改，因为config会自动载入my.php文件中的内容。如果相对全局的配置进行扩展，也可以参考禅道等产品的扩展方式，将扩展文件存放在根目录config/ext/目录下面，在禅道的conifg.php文件底部你可以看到下面代码： 

```
/* Include extension config files. */
$extConfigFiles = glob(dirname(__FILE__) . DIRECTORY_SEPARATOR . 'ext/*.php');
if($extConfigFiles) foreach($extConfigFiles as $extConfigFile) include $extConfigFile;
```
