async (page) => {
  const measure = (label, focus = false) => {
    const element = [...document.querySelectorAll('[data-review]')].find(e => e.dataset.review === label);
    const style = getComputedStyle(element);
    let background = element, bgStyle = style;
    while (background && bgStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && bgStyle.backgroundImage === 'none') {
      background = background.parentElement;
      if (background) bgStyle = getComputedStyle(background);
    }
    const colour = focus ? style.outlineColor : style.color;
    const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = value => rgb(value).slice(0,3).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
    const ratio = (a,b) => { const sorted = [luminance(a),luminance(b)].sort((x,y)=>x-y); return +((sorted[1]+.05)/(sorted[0]+.05)).toFixed(4); };
    return {label, colour, background: bgStyle.backgroundColor, backgroundImage: bgStyle.backgroundImage, fontSize:style.fontSize, outlineStyle:style.outlineStyle, outlineWidth:style.outlineWidth, focusVisible:element.matches(':focus-visible'), ratio: bgStyle.backgroundImage === 'none' ? ratio(colour,bgStyle.backgroundColor) : null};
  };
  const rows = await page.evaluate(measure => {
    const fn = (0,eval)(`(${measure})`);
    return [...document.querySelectorAll('[data-review]')].map(e=>fn(e.dataset.review));
  },measure.toString());
  await page.getByRole('button', {name:'Show this action',exact:true}).hover();
  await page.waitForTimeout(220);
  rows.push(await page.evaluate(measure => (0,eval)(`(${measure})`)('rescue button'),measure.toString()).then(row=>({...row,label:'rescue button hover'})));
  await page.keyboard.press('Tab');
  const focus = [];
  for (const label of ['rescue button','modal link','settings input','card focus','intro focus']) {
    await page.locator(`[data-review="${label}"]`).focus();
    const row = await page.evaluate(({measure,label})=>(0,eval)(`(${measure})`)(label,true),{measure:measure.toString(),label});
    // Focus offset lies outside the button fill: resolve its parent's surrounding surface.
    const surrounding = await page.locator(`[data-review="${label}"]`).evaluate(e=>{
      let p=e.parentElement; while(p && getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)' && getComputedStyle(p).backgroundImage==='none')p=p.parentElement;
      return {colour:getComputedStyle(p).backgroundColor,image:getComputedStyle(p).backgroundImage};
    });
    focus.push({...row,surrounding,ratio:null});
  }
  return {scope:'Isolated HTML fixture with unchanged production CSS; computed cascade, not a full-game interaction or rendered sea measurement.',css:'dist/assets/index-C0JQC03C.css',rows,focus};
}
