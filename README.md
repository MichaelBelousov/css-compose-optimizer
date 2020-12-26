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

<svg height="200px" width="200px" viewbox="0 0 120 120">

  <g class="weak-edges x">
    <line class="edge-a-b edge-x" x1="10" y1="15" x2="10" y2="25" />
    <line class="edge-b-m edge-x" x1="10" y1="35" x2="10" y2="85" />
  </g>
  <g class="weak-edges y">
    <line class="edge-a-b edge-y" x1="60" y1="15" x2="60" y2="25" />
    <line class="edge-b-c edge-y" x1="60" y1="35" x2="60" y2="45" />
    <line class="edge-c-d edge-y" x1="60" y1="55" x2="60" y2="65" />
  </g>
  <g class="weak-edges z">
    <line class="edge-c-d edge-z" x1="110" y1="55" x2="110" y2="65" />
    <line class="edge-d-n edge-z" x1="110" y1="75" x2="110" y2="105" />
  </g>
  <g class="class-x">
    <g class="prop-a">
      <circle class="vert" />
      <text x="0" y="15" class="label">(x, a)</text>
    </g>
    <g class="prop-b">
      <circle class="vert" />
      <text x="0" y="35" class="label">(x, b)</text>
    </g>
    <g class="prop-m">
      <circle class="vert" />
      <text x="0" y="95" class="label">(x, m)</text>
    </g>
  </g>
  <g class="class-y">
    <g class="prop-a">
      <circle class="vert" />
      <text x="50" y="15" class="label">(y, a)</text>
    </g>
    <g class="prop-b">
      <circle class="vert" />
      <text x="50" y="35" class="label">(y, b)</text>
    </g>
    <g class="prop-c">
      <circle class="vert" />
      <text x="50" y="55" class="label">(y, c)</text>
    </g>
    <g class="prop-d">
      <circle class="vert" />
      <text x="50" y="75" class="label">(y, d)</text>
    </g>
  </g>
  <g class="class-z">
    <g class="prop-b">
      <circle class="vert" />
      <text x="100" y="35" class="label">(z, b)</text>
    </g>
    <g class="prop-c">
      <circle class="vert" />
      <text x="100" y="55" class="label">(z, c)</text>
    </g>
    <g class="prop-d">
      <circle class="vert" />
      <text x="100" y="75" class="label">(z, d)</text>
    </g>
    <g class="prop-n">
      <circle class="vert" />
      <text x="100" y="115" class="label">(z, n)</text>
    </g>
  </g>
  <g class="strong-edges">
    <line class="edge-x-y edge-a" x1="20" y1="10" x2="50" y2="10" />
    <line class="edge-x-y edge-b" x1="20" y1="30" x2="50" y2="30" />
    <line class="edge-y-z edge-b" x1="70" y1="30" x2="100" y2="30" />
    <line class="edge-y-z edge-c" x1="70" y1="50" x2="100" y2="50" />
    <line class="edge-y-z edge-d" x1="70" y1="70" x2="100" y2="70" />
  </g>

  <!--
  NOTE: doing it this way, while much more high level mostly, will
  be stripped by renderers like github
  -->
  <style>
  @media (prefers-color-scheme: dark) {
    .label { fill: white; }
    .vert { stroke: #777; }
    .strong-edges   { stroke: white; }
    .weak-edges  { stroke: rgba(255, 255, 255, 0.1); }
  } @media (prefers-color-scheme: light) {
    .label { fill: black; }
    .vert { stroke: black; }
    .strong-edges  { stroke: black; }
    .weak-edges  { stroke: rgba(0, 0, 0, 0.1); }
  }
  .strong-edges { stroke-width: 2px; }
  .weak-edges { stroke-width: 10px; }
  .weak-edges.x { stroke: rgba(255, 0, 0, 0.1); }
  .weak-edges.y { stroke: rgba(0, 0, 255, 0.1); }
  .weak-edges.z { stroke: rgba(0, 255, 0, 0.1); }
  .vert { stroke-width: 2px; r: 5; }
  .label { font-size: 7pt; }
  .prop-a * { /*y: 15;*/ cy: 10 }
  .prop-b circle { cy: 30; }
  .prop-c circle { cy: 50; }
  .prop-d circle { cy: 70; }
  .prop-m circle { cy: 90; }
  .prop-n circle { cy: 110; }
  .class-x * { /*x: 0;*/ cx: 10; }
  .class-x .vert { fill: red; }
  .class-y * { /*x: 50;*/ cx: 60; }
  .class-y .vert { fill: blue; }
  .class-z * { /*x: 100;*/ cx: 110; }
  .class-z .vert { fill: green; }
  </style>
</svg>

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
