async (page) => {
  await page.setContent(`<!doctype html><html><body>
    <div class="modal finale-check-modal">
      <h2><em data-review="large heading">Will lose this voyage</em></h2>
      <p class="modal-lead" data-review="modal lead">Finale introduction</p>
      <p class="finale-rule" data-review="finale rule">Shelter rule</p>
      <div class="finale-retry"><p data-review="retry helper">Replan helper</p></div>
      <div class="finale-checks"><section>
        <span class="ready" data-review="met">Met</span>
        <span class="not-ready" data-review="not met">Not met</span>
        <p data-review="rescue explanation">Nourish the bell</p>
        <button class="secondary-button" data-review="rescue button">Show this action</button>
      </section></div>
      <button class="primary-button" data-review="primary">Keep planning</button>
      <button class="text-button final-accept" data-review="accept defeat">Advance anyway</button>
      <button class="text-button" data-review="modal link">Linger</button>
      <input aria-label="Settings input" data-review="settings input">
      <div class="guide-note" data-review="guide note">Guide note</div>
      <div class="save-status" data-review="save status">Saving failed</div>
      <div class="save-recovery-note" data-review="save recovery">Recovered</div>
    </div>
    <div class="modal result-modal result-lost">
      <p class="result-verdict" data-review="lost verdict">Defeat</p>
      <div class="result-conditions"><span class="needs-care" data-review="unmet result">Growth 2/3</span></div>
      <p class="campaign-unlock" data-review="next shore">Next shore</p>
    </div>
    <div class="modal start-modal"><section class="campaign-intro">
      <button class="primary-button" data-review="intro focus">Begin</button>
    </section><section class="campaign-chart">
      <p class="campaign-progression" data-review="progression">Another bell</p>
      <div class="campaign-pair"><p><span data-review="pair metadata">7 islands</span></p></div>
      <button class="campaign-map current" data-review="card focus"><span class="campaign-map-number" data-review="ordinal">01</span><span class="campaign-map-copy"><small data-review="card subtitle">Map description</small><span class="campaign-map-action" data-review="card action">Continue</span></span></button>
      <p class="campaign-save-note" data-review="save note">Each map starts fresh</p>
    </section></div>
    <button class="campaign-bell"><span><small data-review="bell status">Home, sheltered</small></span><strong><small class="queued-growth" data-review="queued growth">Queued</small></strong></button>
    <button class="campaign-bell needs-shelter"><span><small data-review="unsafe bell status">Adrift</small></span><strong><small class="queued-growth" data-review="unsafe queued growth">Queued</small></strong></button>
    </body></html>`);
  await page.addStyleTag({path:'C:/DEV/Procedural/dist/assets/index-C0JQC03C.css'});
  return await page.locator('body').ariaSnapshot();
}
