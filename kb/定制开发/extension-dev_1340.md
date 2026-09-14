# API机制简介

####  一、API机制介绍： 
 前面章节讲述的扩展机制是需要直接开发PHP或者html, css, js等代码。zentaoPHP还提供了API机制，方便大家来和其他的系统进行集成。 
 API机制都是基于http协议的。返回的数据以json格式存储。 
 zentaoPHP架共实现了两种API机制。一种为直接的页面调用，一种通过超级model调用接口，直接调用model层的方法，下面我们一一来看下。 

####  二、页面直接调用

 当你访问使用zentaoPHP开发的页面时，将访问的url地址中的html换成json，得到的就是json格式的数据。 
 比如http://pms.zentao.net/project-task-8.html，返回的网页格式，把后面的.html改成.json，返回的是什么？对了，返回的是json格式的数据。 
 如果是GET 方式，那么只需要将t参数改成json，http://pms.zentao.net/?m=project&f=task&t=json。 

 返回的数据是做了两次json_encode，下面是代码的示例： 

```
$result = file_get_contents('http://pms.zentao.net/project-task-8.json'); 
$result = json_decode($result);
if($result->status == 'success' and md5($result->data) == $result->md5)
{
    $data = json_decode($result->data);
    print_r($data);
}
```

 先判断第一层里面的result是否正确，md5签名是否正确，然后再对data对象进行json_decode。 

####  1.2.2 超级model调用接口

 页面的调用，存在一定的局限，比如返回的数据可能没有你想要的，或者返回了你不需要的数据。为此，我们特地准备了一个超级model调用接口。该接口的使用方式： 

 首先要为相应的帐号增加超级model调用接口的访问权限。 
 然后就可以通过api模块的getModel方法，获取任意模块的model的公开方法了。 
 getModel方法需要三个参数，分别是模块名，方法名，然后是该方法的参数列表，key1=value1,key2=value2这种方式，多个参数之间用英文逗号隔开。 

 以调用bug模块的getUserBugPairs()方法为例： 
 GET方式调用： ?m=api&f=getModel&module=bug&methodName=getUserBugPairs&params=account=$account 
 PATH_INFO方式：api-getmodel-bug-getUserBugPairs-account=$account.json
