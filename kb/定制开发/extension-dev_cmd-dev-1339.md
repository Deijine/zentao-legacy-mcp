# 命令行调用

除了扩展机制，API机制，禅道还提供了命令行的入口，给大家提供了另外一种控制应用的方式。 

####  一、何谓命令行入口 
 命令行入口位于bin/ztcli。其实它也是一段php代码。它主要是给系统管理员使用的。通过这个入口，可以非常方便的访问到禅道系统的每一个页面，从而为各种便利的操作提供了可能。 

####  二、命令行入口的基本用法： 命令行入口有三个文件，分别是ztcli, ztcli.sh和ztcli.bat。其中ztcli是主体的php脚本。另外两个则是为了使用方便，做的封装。先来看主体脚本的执行。
在bin目录下面执行下面的命令(一定要在bin目录下面。)
语法格式：php ztcli http://xxxx/zentaopms/xxxxx(其中的php，如果找不到，则根据需要换成php可执行文件所在的绝对路径.)
举例来讲，我的禅道的访问路径是 http://pms.zentao.net，我想触发燃烧图的更新程序，命令如下：
php ztcli http://pms.zentao.net/project-computeburn.html

如果你配置的禅道访问方式是通过GET方式，那么命令则变成：
php ztcli "http://pms.zentao.net/?m=project&f=computeburn"，这时后面的url地址需要用引号引起来。

 也就是说你在浏览器里面看到的是什么，通过ztcli都可以访问。 

####  三、封装 如果你php可执行文件不在PATH路径中，那么你可以修改ztcli.sh(linux)或者ztcli.bat(windows)，将其中的路径补全。
比如ztcli.bat中，我可以这样写 d:\zentao\user\local\php\php.exe ztcl %*

 封装好之后，你就可以直接运行ztclibat url地址就可以了。 

####  四、高级用法 在你访问禅道的页面时候，可以将访问的资源变化一下，比如http://pms.zentao.net/project-task-8.html，返回的网页格式，把后面的.html改成.json，返回的是什么？对了，返回的是json格式的数据。如果是GET 方式，那么只需要将t参数改成json，http://pms.zentao.cn/?m=project&f=task&t=json.

通过这个超级的命令行入口，其实可以做很多事情了。具体如何使用，看大家灵活运用了。
