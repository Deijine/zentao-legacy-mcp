# 二次开发编辑器和翻译功能限制使用说明

说明：禅道11.7版本开始，因为安全因素考虑，把二次开发的编辑器和翻译功能拿出来做为插件。
大家需要使用，可以到禅道官网--插件里下载安装。
禅道插件下载地址：http://www.zentao.net/extension-browse.html (http://www.zentao.net/extension-browse.html)

禅道从11.6版本开始，后台--二次开发--编辑器和后台--翻译功能模块，因为安全考虑，改为只能在 http://127.0.0.1:端口号 下访问和操作。 
下面给大家简单说明一下怎么使用二次开发编辑和翻译功能。 

#### 一、禅道用的是windows一键安装包
可以直接登录禅道安装的机器，使用 http://127.0.0.1:端口号 访问禅道，就可以到后台--二次开发--编辑器和后台--翻译里正常访问和使用该功能。 

#### 二、禅道服务器使用的是windows系统
可以远程登录禅道服务器，使用禅道服务器本机的浏览器，使用 http://127.0.0.1:端口号 访问禅道。
这样就可以到后台--二次开发--编辑器和后台--翻译里正常访问和使用该功能。

#### 三、禅道服务器使用的是Linux系统
使用 Linux系统做禅道服务器时，因为端口转发或桥接等方式连接。即便访问禅道的地址是  http://127.0.0.1:端口号 ，也会被判断为当前访问地址不是  http://127.0.0.1:端口号 ，而使用不了 后台--二次开发--编辑器和后台--翻译的功能。 
可以使用编辑器的SSH隧道来连接访问禅道，这样访问  http://127.0.0.1:端口号 时就可以使用后台--二次开发--编辑器和后台--翻译功能模块。
1、连接禅道服务器主机
编辑器打开需要连接的禅道服务器主机，点击属性。

![](https://static.zentao.net/web/data/upload/201907/f_a8a3968691b7e2a0698c8c4b77751f51.png)

2、设置SSH隧道连接
目标端口请填写访问禅道时使用的端口号，设置好后，点击确定。
然后点击下面的连接。
备注：设置SSH隧道连接时，如果之前编辑器已经连接了该服务器，请先都断开连接后，再设置。

![](https://static.zentao.net/web/data/upload/201907/f_66c76d64ae071569c9095fdaa3d57ea4.png)

3、访问禅道 
之前访问禅道的地址为 http://127.0.0.1:10271 ，设置了SSH隧道连接后，禅道的访问地址为  http://127.0.0.1:2222 。端口号要改为设置SSH隧道连接时的侦听端口。
这样访问禅道，就可以使用翻译和二次开发的编辑器功能了。 

![](https://static.zentao.net/web/data/upload/201907/f_32de7b722179f1a84224e30eebde9bdb.png)

![](https://static.zentao.net/web/data/upload/201907/f_bddec43afa6ea4606723db6d9ae5c544.png)

#### 四、附录
1、禅道二次开发编辑器的使用手册：http://www.zentao.net/book/zentaopmshelp/147.html (http://www.zentao.net/book/zentaopmshelp/147.html)
2、禅道翻译功能的使用手册：http://www.zentao.net/book/zentaopmshelp/346.html (http://www.zentao.net/book/zentaopmshelp/346.html)
