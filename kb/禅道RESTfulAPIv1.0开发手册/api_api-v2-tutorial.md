# APIv2.0使用教程

禅道RESTful APIv2.0提供用户认证和业务数据处理的相关接口，涵盖绝大部分禅道的常用功能，遵循HTTP RESTful风格。 
 禅道API在进行业务数据的获取或者处理的时候，需要首先获取认证token，然后再后续请求的header里携带token进行请求。 
 以创建项目为例：
 1. 获取token 
 参考Token的API文档，发送POST请求： 

![](https://static.zentao.net/web/data/upload/zentao/202602/f_f47beb740f8fb912c06bedcda84c1b1c.png)

 2. 请求创建项目API 

![](https://static.zentao.net/web/data/upload/zentao/202602/f_cb85dd1559793009cf1393e69c747592.png)

 注意，在header里需要传递认证token

![](https://static.zentao.net/web/data/upload/zentao/202602/f_88c1990f331a0b2113cbb170175beec6.png)

 如果请求接口，发现返回了401的响应，表示没有正确携带Token

![](https://static.zentao.net/web/data/upload/zentao/202602/f_869f64049b5b71a719fc15241a0a5708.png)
