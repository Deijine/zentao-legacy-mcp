# 公用模块--common

common模块在禅道中是比较特殊的一个模块，禅道里面的众多公用功能都是由common来实现的。 
- common/model.php里面，提供了其他模块都有可能用到的一些方法。比如权限检查，菜单打印等功能。 
- common/view目录下面，则是提供了公用的模板。比如公用的header.html.php，footer.html.php等。还包含了各种jquery插件的初始化代码模板。比如colorbox.html.php。 
- common/lang下面，则是设置了公用的语言项。
所以，后面如果大家需要修改一些语言项，或者修改公用的模板文件，可以到common模块下面寻找相应的代码。
