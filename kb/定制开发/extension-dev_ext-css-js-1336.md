# 对样式表CSS和JavaScript进行扩展

####  一、样式表的扩展 
 如果相对某一个页面的样式进行修改，可以有两种方法。一种就是通过前面所讲的视图文件的扩展来进行。还有一种方法就是单独为这个页面定义样式。比如我想对bug模块的create页面进行样式的重新定义，可以这样定义： 
 在extension/custom/bug/ext/css/下面创建create目录，然后在下面创建一个css文件名，在里面定义自己的样式就可以了。 
框架在加载create方法的时候，会把extension/custom/bug/ext/css/create目录下面的所有css文件都加载进来。

####  二、js的扩展 
 和样式表的扩展一样，某一个页面js的扩展也是同样的规则。比如对bug模块的create页面进行扩展，可以在bug/ext/js/下面创建create目录，然后在里面定义js脚本就可以了。 
框架在加载create方法的时候，会把extension/custom/bug/ext/js/create目录下面的所有js文件都加载进来。
