# 示例：如何修改禅道的语言提示？

下面来看具体的例子吧，以修改bug的优先级列表提示为例： 

1. 在module/bug/下面创建ext/lang/zh-cn/目录，这里面的zh-cn，可以根据实际情况换成相应的语言，比如en, zh-tw。 
2. 在这个目录下面创建一个abc.php，注意，abc的名字是可以随便定义的。 
3. 打开这个文件，重新定义优先级的提示：

```
unset($lang->bug->priList);
$lang->bug->priList[0] = '';
$lang->bug->priList[3] = '3';
$lang->bug->priList[1] = '1';
$lang->bug->priList[2] = '2';
$lang->bug->priList[4] = '4';
```

注意：
1. 如果你定义的是一个列表格式的数据，需要加上unset这一句。这样可以保证列表是完全按照你的定义。
2. 请一定按照我们的扩展机制来存放文件，这样可以保证我们后面升级，不会覆盖你自己的修改的代码。 
3. windows下面编辑，建议使用ultraedit，保存的时候，保存成utf-8编码，nobom格式。否则会造成系统不正常。
