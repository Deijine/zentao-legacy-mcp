# 对视图层(ui)扩展

视图文件的扩展分为两种方式，一种是完全覆盖，第二种是通过钩子机制来扩展。 

####  一、完全覆盖 
 视图文件的覆盖可以通过完全覆盖的方式来重新定义。比如我对bug模块的create页面进行扩展。原来的视图文件是存放在module/bug/ui/create.html.php。如果需要对其进行扩展，只需要将这个create.html.php拷贝到extension/custom/bug/ext/ui/create.html.php，然后对这个网页进行修改就可以了。 
需要注意的是拷贝过去时候，包含路径要做相应的改动。

####  二、通过钩子进行扩展 
 第一种方法比较简单，也比较直观，但有它的缺点，就是代码无法重用。假设后面版本有了新的改动之后，老版本的视图文件和新版本的程序就有可能不兼容。所以可以考虑通过钩子脚本来实现代码的重用。钩子脚本的命名规则为方法名.扩展名.html.hook.php。该钩子文件会在整个模板加载完之后加载，在里面可以执行相应的php代码。这样就提供了一种通过js来动态修改页面元素的机制，从而达到对页面元素的完全控制。 
 比如extension/custom/misc/ext/ui/view.test.html.hook.php 

```
<?php
namespace zin;
query('button#toStory, a#createCase')->remove();
```

 这段代码通过选择器移除掉button和a标签。注意：使用PHP编写的zin代码，会转义为js代码执行。 

 更详细的例子可以下载下方附近进行参考。
