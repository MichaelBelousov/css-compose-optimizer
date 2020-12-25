import csstree from 'css-tree';

// there's got to be a better name for duplicity in graphs like this?
class CoincidenceMatrix {
    private map = new Map<string, Map<string, number>>();

    public incPair(x: string, y: string) {
        if (!this.map.has(x)) this.map.set(x, new Map<string, number>());
        const submap = this.map.get(x)!;
        if (!submap.has(y)) submap.set(y, 0);
        submap.set(y, submap.get(y)! + 1);
    }
}

function parseSource() {
    const coincidence = new CoincidenceMatrix();

    const ast = csstree.parse('.example { world: "!" }');
    // traverse AST and modify it
    csstree.walk(ast, (node) => {
        if (node.type === 'Block') {
            node.children
                .filter((c): c is csstree.Declaration => c.type === 'Declaration')
                .forEach(d => coincidence.incPair(d.property, d.value.loc!.source))
        }
    });

    console.log(coincidence);
}

