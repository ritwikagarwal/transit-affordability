import {chapters} from '../data/story.js';
import {$,escapeHTML as esc} from './dom.js';
import {sourceButtons} from './evidence.js';
import {routeBadges} from './routes.js';

export function renderStory(index, network) {
  const chapter=chapters[index];
  document.body.dataset.chapter=index;
  $('#chapter-label').textContent=chapter.label;
  $('#chapter-title').textContent=chapter.title;
  $('#chapter-lead').textContent=chapter.lead;
  $('#chapter-body').textContent=chapter.body;
  const routes={B19:['D'],L15:['L'],'640':['4','5','6']}[chapter.station];
  let detail=routes?routeBadges(routes,network?.routes||[]):'';
  if(chapter.facts) detail+=`<div class="facts">${chapter.facts.map(([value,label,context])=>`
    <div class="fact"><strong>${esc(value)}</strong><span>${esc(label)}</span><small>${esc(context)}</small></div>`).join('')}</div>`;
  if(chapter.note) detail+=`<p class="story-note">${esc(chapter.note)}</p>`;
  $('#chapter-extra').innerHTML=detail;
  $('#chapter-refs').innerHTML=sourceButtons(chapter.refs);
  $('#chapter-track').innerHTML=chapters.map((item,i)=>`
    <button class="chapter-tab ${i===index?'active':''}" data-chapter="${i}"
      ${i===index?'aria-current="step"':''} aria-label="Chapter ${i+1}: ${esc(item.short)}">
      <span>${String(i+1).padStart(2,'0')}</span><b>${esc(item.short)}</b>
    </button>`).join('');
  $('#step-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
  $('#next').innerHTML=`${esc(chapter.next)} <span aria-hidden="true">→</span>`;
  $('#previous').disabled=index===0;
  $('#story-copy').scrollTop=0;
  const photo={preserve:['assets/J1-01.jpg','Jefferson St','Field context. Building condition and energy use have not been assessed.'],thermal:['assets/J3-01.jpg','Brooklyn Bridge-City Hall','Field photograph. Recoverable heat has not been measured.'],pilot:['assets/J3-09.jpg','Continue at station scale','Open the separate Station Lab to examine conditions and byproducts.']}[chapter.view];
  $('#field-card').hidden=!photo;
  if(photo){$('#field-card').innerHTML=`<button data-source="field"><img src="${photo[0]}" alt="${esc(photo[2])}"><div><strong>${esc(photo[1])} <span>↗</span></strong><small>${esc(photo[2])}</small></div></button>`;}
  $('#map-location').textContent=chapter.station?({B19:'18 Av / New Utrecht',L15:'Jefferson St','640':'Brooklyn Bridge-City Hall'}[chapter.station]):'New York City';
  $('#announcement').textContent=`Chapter ${index+1} of ${chapters.length}. ${chapter.short}.`;
  return chapter;
}
