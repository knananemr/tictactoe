// tests/unit/migrations.test.js
(function (L) {
  'use strict';
  const migrations = L.core.migrations;

  test('migrations.migrate: runs an injected fake list in order', function () {
    const order = [];
    const steps = {
      1: function (doc) { order.push('1 to 2'); doc.trail = ['a']; return doc; },
      2: function (doc) { order.push('2 to 3'); doc.trail.push('b'); return doc; },
      3: function (doc) { order.push('3 to 4'); doc.trail.push('c'); return doc; }
    };
    const out = migrations.migrate({ app: 'laser-practice', schemaVersion: 1, people: [] }, { steps: steps, target: 4 });
    eq(order, ['1 to 2', '2 to 3', '3 to 4']);
    eq(out.schemaVersion, 4);
    eq(out.trail, ['a', 'b', 'c']);
  });

  test('migrations.migrate: starts from the document\'s own version', function () {
    const order = [];
    const steps = {
      1: function (doc) { order.push(1); return doc; },
      2: function (doc) { order.push(2); return doc; },
      3: function (doc) { order.push(3); return doc; }
    };
    const out = migrations.migrate({ schemaVersion: 2 }, { steps: steps, target: 4 });
    eq(order, [2, 3]);
    eq(out.schemaVersion, 4);
  });

  test('migrations.migrate: works on a copy and never changes what it was given', function () {
    const original = { schemaVersion: 1, people: [{ name: 'Dana' }] };
    const steps = { 1: function (doc) { doc.people[0].name = 'Changed'; doc.added = true; return doc; } };
    const out = migrations.migrate(original, { steps: steps, target: 2 });
    eq(original, { schemaVersion: 1, people: [{ name: 'Dana' }] });
    eq(out.people[0].name, 'Changed');
    ok(out !== original);
  });

  test('migrations.migrate: a step may return a new object, or nothing', function () {
    const steps = {
      1: function (doc) { return { schemaVersion: 1, replaced: true, old: doc.keep }; },
      2: function (doc) { doc.touched = true; }
    };
    const out = migrations.migrate({ schemaVersion: 1, keep: 'k' }, { steps: steps, target: 3 });
    eq(out, { schemaVersion: 3, replaced: true, old: 'k', touched: true });
  });

  test('migrations.migrate: refuses a newer version', function () {
    const error = throws(function () { migrations.migrate({ schemaVersion: 2 }); });
    eq(error.code, 'newer');
    const error2 = throws(function () {
      migrations.migrate({ schemaVersion: 5 }, { steps: { 1: function (d) { return d; } }, target: 4 });
    });
    eq(error2.code, 'newer');
  });

  test('migrations.migrate: refuses a document with no usable version', function () {
    eq(throws(function () { migrations.migrate({}); }).code, 'invalid');
    eq(throws(function () { migrations.migrate({ schemaVersion: '1' }); }).code, 'invalid');
    eq(throws(function () { migrations.migrate({ schemaVersion: 0 }); }).code, 'invalid');
    eq(throws(function () { migrations.migrate({ schemaVersion: 1.5 }); }).code, 'invalid');
    eq(throws(function () { migrations.migrate(null); }).code, 'invalid');
  });

  test('migrations.migrate: refuses when a step on the way is missing', function () {
    const error = throws(function () {
      migrations.migrate({ schemaVersion: 1 }, { steps: { 2: function (d) { return d; } }, target: 3 });
    });
    eq(error.code, 'missing');
  });

  test('migrations: version 1 is the current format, so there is nothing to run', function () {
    eq(L.DATA_FORMAT, 1);
    eq(Object.keys(migrations.STEPS), []);
    const doc = L.core.schema.emptyDoc();
    const out = migrations.migrate(doc);
    eq(out, doc);
    ok(out !== doc, 'still a copy');
  });
})(window.Laser);
