#include <assert.h>
#include <bare.h>
#include <js.h>
#include <sqlite-vector.h>
#include <sqlite3.h>
#include <utf.h>
#include <uv.h>

typedef struct {
  sqlite3 *handle;
} bare_sqlite_t;

static js_value_t *
bare_sqlite_vector_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_sqlite_t *db;
  err = js_get_value_external(env, argv[0], (void **) &db);
  assert(err == 0);

  char *errmsg = NULL;

  int status = sqlite3_vector_init(db->handle, &errmsg, NULL);

  if (status != SQLITE_OK) {
    err = js_throw_error(env, NULL, errmsg != NULL ? errmsg : sqlite3_errstr(status));
    assert(err == 0);

    if (errmsg != NULL) sqlite3_free(errmsg);
  }

  return NULL;
}

static js_value_t *
bare_sqlite_vector_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", bare_sqlite_vector_init)
#undef V

  return exports;
}

BARE_MODULE(bare_sqlite_vector, bare_sqlite_vector_exports)
