# 增加新的类库

独立的类库文件和通常的php class没有任何区别，只要将其存放在lib目录下面，文件名为小写的类名，或者建立一个目录。
比如，新增一个image的类，可以存放在lib/image.class.php，也可以存放在lib/image/image.class.php。

注意：与其他的定制代码不同，类库是放在lib目录，而不是extension/custom目录。
