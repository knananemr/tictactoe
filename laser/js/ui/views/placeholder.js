// js/ui/views/placeholder.js
// The "arrives in step N" page of a tab that is not built yet (7.10). A later step replaces
// Laser.views.<name> with the real view and removes the entry here.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const c = L.ui.components;

  const PAGES = {
    schedule: {
      title: 'Schedule', icon: 'calendar', step: 3,
      text: 'Your appointments, past treatments and the 4-week rebooking list.'
    },
    leads: {
      title: 'Leads', icon: 'leads', step: 6,
      text: 'People who asked about laser and are not clients yet.'
    },
    progress: {
      title: 'Progress', icon: 'progress', step: 7,
      text: 'Your months side by side: people treated, new clients, money received.'
    }
  };

  // make({ title, icon, text, step }) -> a view
  function make(page) {
    return {
      title: page.title,
      render: function () {
        return html`<div class="page page--narrow" data-view="placeholder">${c.card({
          body: c.empty({
            icon: page.icon, title: page.title, text: page.text,
            note: 'Arrives in step ' + page.step
          })
        })}</div>`;
      }
    };
  }

  L.views.placeholder = { make: make };
  Object.keys(PAGES).forEach(function (name) { L.views[name] = make(PAGES[name]); });
})(window.Laser);
