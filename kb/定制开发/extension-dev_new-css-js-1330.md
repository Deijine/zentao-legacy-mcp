# 新增前端样式CSS和JavaScript

####  一、样式表的扩展 
 如果相对某一个页面的样式进行修改，可以有两种方法。一种就是通过前面所讲的视图文件的扩展来进行。还有一种方法就是单独为这个页面定义样式。比如我想对oa模块的create页面进行样式的重新定义，可以这样定义： 
 在extension/custom/oa/css/下面创建create.ui.js，在里面定义自己的样式就可以了。 
框架在加载create方法的时候，会把extension/custom/oa/css/create.ui.css文件加载进来。

####  二、js的扩展 
 和样式表的扩展一样，某一个页面js的扩展也是同样的规则。比如对oa模块的create页面进行扩展，可以在oa/js/下面创建create.ui.js，然后在里面编写js代码可以了。 
框架在加载create方法的时候，会把extension/custom/oa/js/create.ui.js的js代码加载进来。
