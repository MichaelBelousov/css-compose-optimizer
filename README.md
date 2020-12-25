# css-compose-optimizer

## Idea

Minify CSS further by composing CSS classes, that is turning one
CSS class into multiple aggregated, where the two constituent CSS classes

## Demonstration

Replace:

```html
<div class="a"></div>
<div class="b"></div>
<style type="text/css">
    .a {display: none; opacity: 0; border: 1px;}
    .b {display: none, opacity: 0, border: 2px;}
</style>
```

With:

```html
<div class="a_ c"></div>
<div class="b_ c"></div>
<style type="text/css">
    .a_ {border: 1px;} .b_ {border: 2px;}
    .c {display: none; opacity: 0;}
</style>
```

Byte-for-byte I may not have made that one optimal but you can see the idea. The more rules share
property values, the more savings you can get with this method.

There may need to be some sanity checking that the resulting algorithm doesn't give each CSS value its own
class which would translate to composing all style property values in the element classname. Profiling of
browser class list handling would need to be done.

## Theory

Maybe the strongly connected components of a graph where each (class-)rule is a node
and connected to any other (class-)rules that have a same property value. I need to do
this part out. I was also thinking a (perhaps weighted) adjacency matrix would be helpful
to construct and figure out the optimal decomposition of css rules. The goal would be to
then compose each original class from a union of several of the new optimal classes.

