# zentaoPHP框架的分页解决方案 - zentaoPHP框架手册

分页对于基于数据库的应用来讲，是很常见的一个问题。新的zentaoPHP框架中，提供了内置的分页功能。使用如下： 
我们以查询用户列表为例，在应用中建立一个user的模块，在其中的control文件中，定义一个browse方法，来完成分页的功能： 

#### 一、browse方法关于分页的三个参数
browse方法需要定义三个参数：recTotal, recPerPage, pageID，变量名是固定的。

```
public function browse($recTotal, $recPerPage, $pageID)
{
    /* 加载分页类，并生成pager对象。*/
    $this->app->loadClass('pager', $static = true);
    $pager = new pager($recTotal, $recPerPage, $pageID);
    /* 将分页类传给model，进行分页。*/
    $users = $this->user->getList($pager);
}

```

#### 二、model方法中调用pager对象
model中定义一个getList方法，接收pager对象，并在dao查询的时候，调用pager($pager)方法来生成分页语句。 

```
public function getList($pager)
{
    return $this->dao->select(*)->from('user')->page($pager)->fetchAll();
}

```

#### 三、control中将pager对象赋值给模板
再回到control的browse方法中，将pager对象赋值给模板。 

```
public function browse($recTotal, $recPerPage, $pageID)
{
    /* 加载分页类，并生成pager对象。*/
    $this->app->loadClass('pager', $static = true);
    $pager = new pager($recTotal, $recPerPage, $pageID);
    /* 将分页类传给model，进行分页。*/
    $users = $this->user->getList($pager);

    /* 赋值到模板。*/
    $this->view->users = $users;
    $this->view->pager = $pager;
}
```

模板中显示分页链接：show()方法有两个参数，$align: left, center, right，默认是居右对齐。$type: full|short|shortest 

```
<?php $pager->show();?>
```
