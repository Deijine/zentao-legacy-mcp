# zentaoPHP框架的两种请求方式 - zentaoPHP框架手册

zentaoPHP框架共支持两种方式，一种是传统的GET方式，一种是静态友好的方式。 

#### 一、传统GET方式
可以在config/my.php里面设置requestType为GET来启用GET方式。当打开GET方式之后，访问地址格式如下： 
index.php?m=$moduleName&f=$methodName&$param1=$value1&param2=valur2&t=html 
m: 代表模块名称，比如m=blog，则代表访问blog模块。 
f: 代表要访问的模块control里面的方法名，比如f=edit，代表访问blog/control.php里面定义的edit方法。 
t: 代表模板类型，默认是html，比如f=edit&t=html，对应的模板文件是blog/view/edit.html.php。 
其他的都是参数，也就是变量中指定的方法的参数。比如id=1，则代表终调用blog/control.php里面的edit方法，并向其传id=1的参数。 

#### 二、静态友好方式
静态友好方式需要webserver的url重写支持。如果是使用apache作为webserver的话，框架已经自带了.htaccess文件，里面已经包含了url重写规则。 
如果是nginx，需要配置下面的参数： 

```
 location / 
 {
     try_files $uri $uri/ /index.php?$args;
 }
 location ~ \.php$ 
 {
     fastcgi_pass  unix:/var/run/php5-fpm.sock;
     fastcgi_index index.php;
     fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
     fastcgi_param PATH_INFO $request_uri;
     include modules-enabled/fastcgi.conf;
 }
```
 与此同时还需要修改config/my.php，把requestType设置成PATH_INFO。还有一个变量分隔符，需要设置。框架默认的是短横线:-。
  比如访问http://localhost/zentaophp/blog/view/179.html：blog为模块名，view是方法名，179是参数，.html则代表了模板的类型。
