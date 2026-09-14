# 需要登录验证的API调用

在使用api机制进行集成的时候，有的应用场景会涉及到会话登录。这种情况下面会话调用需要经过下面的三个步骤： 

####  一、获得session。 首先要访问api模块的getSessionID方法，获得session。

GET方式：?m=api&f=getSessionID&t=json

```
http://your-zentao.com/index.php?m=api&f=getSessionID&t=json
```

PATHINFO: api-getsessionid.json

```
http://your-zentao.com/api-getsessionid.json
```

 返回的格式中包含sessionName和sessionID。 

```
{
    "status": "success",
    "data": {
        "sessionName": "zentaosid",
        "sessionID": "a7sd6f8g7s8df68gs7df6g"
    }
}
```

 在后续的访问中，必须以cookie的方式，或者GET方式，将session传递给服务器。 
 简单的方式就是在请求的url地址后面追加$sessionName=$sessionID。比如http://pms.zentao.net/index.json?zentaosid=xxxxxxx 
 注意：上面地址中的sid参数名称可以在config文件里面通过 $config->sessionVar 设置，比如禅道config/config.php文件中 $config->sessionVar = 'zentaosid'。老版本禅道默认是 sid，新版本禅道默认是 zentaosid，可以具体查看一下使用禅道的代码中是如何定义的。 

####  二、验证用户身份。 然后可以访问user模块的login方法，来进行用户身份的验证。
用户身份验证，需要提供用户名和密码，以post方式传递给user-login方法。
变量名为： account, password。

####  三、调用相应的API。

 用户验证通过之后，就可以通过页面调用的api，或者超级model调用的api来获取相应的数据了。
