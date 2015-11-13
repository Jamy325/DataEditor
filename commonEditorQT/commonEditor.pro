QT       += webkitwidgets network widgets
FORMS     = window.ui
HEADERS   = window.h \
    json_batchallocator.h \
    autolink.h \
    config.h \
    features.h \
    forwards.h \
    json.h \
    reader.h \
    value.h \
    writer.h
SOURCES   = main.cpp \
            window.cpp \
    json_reader.cpp \
    json_value.cpp \
    json_writer.cpp \
    json_internalarray.inl \
    json_internalmap.inl \
    json_valueiterator.inl

# install
target.path = $$[QT_INSTALL_EXAMPLES]/webkitwidgets/domtraversal
INSTALLS += target
RC_FILE = application.rc

LIBS += -lUser32 -lShell32

TRANSLATIONS += myapp.ts
