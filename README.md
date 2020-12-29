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
    .b {display: none; opacity: 0, border: 2px;}
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

~~Maybe the strongly connected components of a graph where each (class-)rule is a node
and connected to any other (class-)rules that have a same property value. I need to do
this part out. I was also thinking a (perhaps weighted) adjacency matrix would be helpful
to construct and figure out the optimal decomposition of css rules. The goal would be to
then compose each original class from a union of several of the new optimal classes.~~

### Graph Approach

Suppose you have the following CSS rules (we can ignore HTML class lists because optimizing those
trivially follows from optimizing the underlying CSS classes).

```css
.x {a:0; b:0; m:0}
.y {a:0; b:0; c:0; d:0}
.z {b:0; c:0; d:0; n:0}
```

- Let `G` be the graph of vertices `V` and edges `E`.
- For each class, and for each property of that class, let there be a vertex in `V`.

<p align="center">
  <img alt="There should be a graph here" src="/doc/graph.svg" width="400" height="400" />
</p>

- It follows intuitively that since all nodes can be placed in rows and columns,
  with only horizontal edges, that this is a planar graph, at least for the edges that
  represent a same property in different CSS rules.
- The simplicity of this graph probably shows that using a graph to reason about this
  problem is an over-generalization of the problem domain, and we could use a
  simpler structure. We will nonetheless proceed
- Our idea is then to collapse all shared edges one by one from each pair of rules

#### __So then, which is more efficient?__

1. collapsing the maximal shared property wherever possible
2. collapsing the maximal shared properties

Our minimization criterion is to have the least amount of vertices in the graph,
also the least amount of property members in all of our classes.

If we try *method 1*, we get the following vertices (expressed as CSS rules):

```CSS
.xyz {b:0}
.xy {a:0}
.yz {c:0; d:0}
.x {m:0; composes: "xyz xy"}
.y {composes: "xy xyz yz"}
.z {n:0; composes: "xyz yz"}
```

This gives us 6 unique properties total, and 6 rules.

If we try *method 2*, we get the following vertices (expressed as CSS rules):

```CSS
.xy {a:0;b:0}
.yz {b:0;c:0;d:0}
.x {m:0; composes: "xy"}
.y {composes: "xy yz"}
.z {n:0; composes "yz"}
```

Here we get 7 properties and 5 rules.

If we use a simple weight composition function of multiplication, then
*method 2* is more efficient with a minimal weight of 35, while *method 1*
results in 36 but less unique properties. Profiling web browsers will result in
choosing the best trade off.

### Subsets approach

Naively, for each class, get all possible subclasses with size > 1.
That gives us an exponential complexity of _O(c &times; 2<sup>n-2</sup>))_ where _c_ is the
amount of classes and _n_ is the maximum class size.
We can however probably quicken it by limiting our property test set to those that have high
co-incidences.
