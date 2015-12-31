/****************************************************************************
**
** Copyright (C) 2015 The Qt Company Ltd.
** Contact: http://www.qt.io/licensing/
**
** This file is part of the examples of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:BSD$
** You may use this file under the terms of the BSD license as follows:
**
** "Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are
** met:
**   * Redistributions of source code must retain the above copyright
**     notice, this list of conditions and the following disclaimer.
**   * Redistributions in binary form must reproduce the above copyright
**     notice, this list of conditions and the following disclaimer in
**     the documentation and/or other materials provided with the
**     distribution.
**   * Neither the name of The Qt Company Ltd nor the names of its
**     contributors may be used to endorse or promote products derived
**     from this software without specific prior written permission.
**
**
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
** "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
** LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
** A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
** OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
** LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
** THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
** (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
**
** $QT_END_LICENSE$
**
****************************************************************************/
#include <windows.h>
#include <Shlobj.h>

#include <QtWidgets>
#include <QtWebKitWidgets>
#include "window.h"
#include <QWebSettings>
#include <stdlib.h>
#include <QJsonDocument>
#include <string>

#include <QTextCodec>


//! [Window constructor]
Window::Window(QWidget *parent)
    : QMainWindow(parent), _pFile(NULL)
{
    setupUi(this);
    QWebSettings* setting = webView->settings();
    setting->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    setting->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    setting->setAttribute(QWebSettings::LocalContentCanAccessFileUrls, true);
    setting->setAttribute(QWebSettings::JavascriptEnabled, true);

    // 创建QAction并设置快捷键
//    QAction *actionA = new QAction(this);
//    actionA->setShortcut(QKeySequence(tr("F5")));
//    connect(actionA, &QAction::triggered, webView, &QWebView::reload);

    QWebPage *page = webView->page();
    QWebFrame* frame = page->mainFrame();
    _process = new QProcess(this);
    _process->setWorkingDirectory(QCoreApplication::applicationDirPath());
    //_process->startDetached("cmd.exe");
    attachObject();
    connect( frame, SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(attachObject()) ); //当网页被载入或者刷新时，将暴露给webkit的QObject和JavaScript进行连接
}
//! [Window constructor]

//! [set URL]
void Window::setUrl(const QUrl &url)
{    
    webView->setUrl(url);
}

void Window::closeEvent(QCloseEvent *event)
{
    QMessageBox::StandardButton button;
      button = QMessageBox::question(this, tr("warnning"),
          tr("Do you really want to exit?"),
          QMessageBox::Yes | QMessageBox::No);

      if (button == QMessageBox::No) {
          event->ignore();  //忽略退出信号，程序继续运行
      }
      else if (button == QMessageBox::Yes) {
          event->accept();  //接受退出信号，程序退出
      }
}

void Window::keyPressEvent(QKeyEvent *event)
{
    switch (event->key())
    {
        case Qt::Key_F5:
         {
             if(QMessageBox::information(NULL,
                                         tr("warnning"),
                                         tr("reload may be lost unsave data, do you continue?"),
                                         QMessageBox::Yes | QMessageBox::No,
                                         QMessageBox::Yes) == QMessageBox::Yes )
             {
                   webView->reload();
             }

             break;
         }

    case Qt::Key_F:
        {
            if (event->modifiers() & Qt::ControlModifier){
                QString selectText = _selectText;
                if (selectText.isEmpty())
                {
                    selectText = webView->selectedText();
                }

                 bool isOK;
                QString text = QInputDialog::getText(NULL, tr("find text Dialog"),
                                                                   tr("please input you want to find"),
                                                                   QLineEdit::Normal,
                                                                   selectText,
                                                                   &isOK);
                if (isOK){
                    webView->findText("", QWebPage::FindFlag::HighlightAllOccurrences);
                    webView->findText(text, QWebPage::FindFlag::HighlightAllOccurrences);
                    _selectText = text;
                }
            }
            break;
        }
    case Qt::Key_F3:{
        QString selectText = _selectText;
        if (selectText.isEmpty())
        {
           selectText = webView->selectedText();
        }

         if (!selectText.isEmpty())
         {
             webView->findText(selectText);
         }
        break;
    }

    case Qt::Key_Escape:
        {
            _selectText = "";
            webView->findText("", QWebPage::FindFlag::HighlightAllOccurrences);
        }
        break;
    }
    QMainWindow::keyPressEvent(event);
    qDebug() << "keyPressEvent:key:" << event->key()
             << "sancode:" << event->nativeScanCode()
             << "virtualcode:" << event->nativeVirtualKey();
}

//! [导出接口到js]
void Window::attachObject()
{
    QWebPage *page = webView->page();
    QWebFrame*  frame = page->mainFrame();
    frame->addToJavaScriptWindowObject(QString("external"), this);
}

//! [js执行系统命令]
QString Window::system(const QString &cmd)
{
   qDebug() << "js execute cmd:" << cmd;
   _process->start("cmd.exe",  QStringList() << "/c" << cmd);
   _process->waitForStarted(3000);
   _process->waitForFinished(3000);

    Json::Value result;
    result["exitCode"] = _process->exitCode();
    result["standardOutput"] = QString::fromLocal8Bit(_process->readAllStandardOutput()).toStdString();
    result["standardError"] = QString::fromLocal8Bit(_process->readAllStandardError()).toStdString();

    Json::FastWriter w;
    return QString(w.write(result).c_str());
}


/**
mode有以下几种方式：
打开方式	说明
r	以只读方式打开文件，该文件必须存在。
r+	以读/写方式打开文件，该文件必须存在。
rb+	以读/写方式打开一个二进制文件，只允许读/写数据。
rt+	以读/写方式打开一个文本文件，允许读和写。
w	打开只写文件，若文件存在则长度清为0，即该文件内容消失，若不存在则创建该文件。
w+	打开可读/写文件，若文件存在则文件长度清为零，即该文件内容会消失。若文件不存在则建立该文件。
a	以附加的方式打开只写文件。若文件不存在，则会建立该文件，如果文件存在，写入的数据会被加到文件尾，即文件原先的内容会被保留（EOF符保留)。
a+	以附加方式打开可读/写的文件。若文件不存在，则会建立该文件，如果文件存在，则写入的数据会被加到文件尾后，即文件原先的内容会被保留（原来的EOF符 不保留)。
wb	以只写方式打开或新建一个二进制文件，只允许写数据。
wb+	以读/写方式打开或建立一个二进制文件，允许读和写。
wt+	以读/写方式打开或建立一个文本文件，允许读写。
at+	以读/写方式打开一个文本文件，允许读或在文本末追加数据。
ab+	以读/写方式打开一个二进制文件，允许读或在文件末追加数据。
*/

//! [js打开文件]
QString Window::open(const QString &filePath, const QString &flag)
{
    Json::Value result;
    if (_pFile)
    {
       result["success"] = false;
       result["msg"] = "pre file not close";
    }
    else
    {
         _pFile = new QFile(filePath);
        QIODevice::OpenMode tag = 0;
        if (flag == "r") tag = QIODevice::ReadOnly;
        else if (flag == "r+") tag = QIODevice::ReadWrite;
        else if (flag == "rb+") tag = QIODevice::ReadWrite;
        else if (flag == "rt+") tag = QIODevice::ReadWrite | QIODevice::Text;
        else if (flag == "w") tag = QIODevice::WriteOnly;
        else if (flag == "w+") tag = QIODevice::WriteOnly | QIODevice::Truncate;
        else if (flag == "a") tag = QIODevice::WriteOnly | QIODevice::Append;
        else if (flag == "a+") tag = QIODevice::ReadWrite | QIODevice::Append;
        else if (flag == "wb") tag = QIODevice::WriteOnly;
        else if (flag == "wb+") tag = QIODevice::ReadWrite;
        else if (flag == "wt") tag = QIODevice::ReadWrite;
        else if (flag == "wt+") tag = QIODevice::ReadWrite | QIODevice::Text;
        else if (flag == "at+") tag = QIODevice::ReadWrite | QIODevice::Text;
        else if (flag == "wt+") tag = QIODevice::ReadWrite | QIODevice::Text | QIODevice::Append;
        else if (flag == "wt+") tag = QIODevice::ReadWrite | QIODevice::Append;
        else {
            tag = QIODevice::ReadWrite;
        }


         if (!_pFile->open(tag))
         {
            result["success"] = false;
            result["msg"] = "file not found";
            _pFile->close();
            delete _pFile;
            _pFile = NULL;
         }
         else
         {
             result["success"] = true;
         }
    }

    Json::FastWriter w;
    return QString(w.write(result).c_str());
}

QString Window::all()
{
    Json::Value result;
     result["success"] = false;
    if (_pFile)
    {
      _pFile->seek(0);
      QByteArray pArray = _pFile->readAll();
      QString str = QString::fromLocal8Bit(pArray);
      result["msg"] = str.toStdString();
      result["success"] = true;
    }
    else
    {
       result["msg"] = "file not open";
    }


    Json::FastWriter w;
    return QString(w.write(result).c_str());
}

void Window::close()
{
    if (_pFile)
    {
        _pFile->close();
        delete _pFile;
        _pFile = NULL;
    }

    if (_process)
    {
        _process->close();
        delete _process;
    }

    _process = NULL;
    _pFile = NULL;
}

QString Window::write(const QString &content)
{
    Json::Value result;
    QString msg;
    if (_pFile && _pFile->isWritable())
    {
      QByteArray str = content.toLocal8Bit();
      _pFile->write(str);
      result["success"] = true;
      result["msg"] = "";
    }
    else
    {
        result["success"] = false;
        result["msg"] = "file not open";
    }
    Json::FastWriter w;
    return QString(w.write(result).c_str());
}

void Window::seekg(int pos)
{
    if (_pFile)
    {
       //fseek(_pFile, pos, SEEK_SET);
        _pFile->seek(pos);
    }
}

QString Window::getDir(const QString &dir)
{
    Json::Value val;
    RecursiveFindFile(dir, val);

    Json::FastWriter w;
    std::string str = w.write(val);
    QString result = QString(str.c_str());
    return result;
}


HRESULT GetContextMenuForFSItem( LPCWSTR path,IContextMenu**ppCM )
{
    PIDLIST_ABSOLUTE pidlAbs;
    HRESULT hr = SHParseDisplayName(path,0,&pidlAbs,0,0);
    if (SUCCEEDED(hr))
    {
        IShellFolder *pSF;
        PCUITEMID_CHILD pidlLast;
        hr = SHBindToParent(pidlAbs,IID_IShellFolder,(void**)&pSF,&pidlLast);
        if (SUCCEEDED(hr))
        {
            hr = pSF->GetUIObjectOf(0,1,&pidlLast,IID_IContextMenu,0,(void**)ppCM);
            pSF->Release();
        }
        ILFree(pidlAbs);
    }else{
        qDebug() << "SHParseDisplayName fail:" << hr;
    }
    return hr;
}


QString Window::exeContentCmd(const QString &path, const QString &cmd)
{
    qDebug() << "exeContentCmd " << path << " cmd:" << cmd;
    QString newPath = path;
    newPath.replace(QString("/"), QString("\\"));

    IContextMenu*pCM;
    HRESULT hr = GetContextMenuForFSItem(newPath.toStdWString().data(), &pCM);

    if (SUCCEEDED(hr))
    {
        HMENU hMenu = CreatePopupMenu();
        hr = pCM->QueryContextMenu(hMenu,0,1,0x7fff,0);
        if (SUCCEEDED(hr))
        {
            hr = -1;
            UINT cnt = GetMenuItemCount(hMenu);
            for (int i = 0; i < cnt; ++i)
            {
                wchar_t buf[MAX_PATH] = {0};

                //查找命令
                GetMenuString(hMenu, i, buf,MAX_PATH, MF_BYPOSITION);
                QString menuName = QString::fromStdWString(buf);

                qDebug() << "item:" << menuName;
                if (menuName.toLower().mid(0, cmd.length()) != cmd.toLower())
                {
                    continue;
                }

                //找到菜单项目id
                MENUITEMINFO mi ={0};
                mi.cbSize = sizeof(mi);
                mi.fMask = MIIM_ID;
                if (GetMenuItemInfo(hMenu, i, true, &mi )){
                    CMINVOKECOMMANDINFOEX info = { 0 };
                    info.cbSize = sizeof(info);
                    info.fMask = CMIC_MASK_UNICODE;
                    info.lpVerb  = MAKEINTRESOURCEA(mi.wID - 1);
                    info.lpVerbW = MAKEINTRESOURCEW(mi.wID - 1);
                    info.nShow = SW_SHOWNORMAL;

                    //直接执行
                    pCM->InvokeCommand((LPCMINVOKECOMMANDINFO)&info);
                    hr = S_OK;
                }
                break;
            }
        }

        pCM->Release();
        DestroyMenu(hMenu);
    }


    Json::Value result;
    result["success"] = SUCCEEDED(hr);
    result["msg"] = hr;
    Json::FastWriter w;
    std::string str = w.write(result);
    return QString(str.c_str());
}

QString Window::FileSelectDialog(const QString& title, const QString& defaultPath, const QString& filter)
{
    QString path = QFileDialog::getOpenFileName(this, title, defaultPath, filter);
    return path;
}
//! [set URL]
    
//! [begin document inspection]
void Window::on_webView_loadFinished()
{
//    treeWidget->clear();

//    QWebFrame *frame = webView->page()->mainFrame();
//    QWebElement document = frame->documentElement();

  //  examineChildElements(document, treeWidget->invisibleRootItem());
}
//! [begin document inspection]

//! [traverse document]
void Window::examineChildElements(const QWebElement &parentElement,
                                  QTreeWidgetItem *parentItem)
{
//    QWebElement element = parentElement.firstChild();
//    while (!element.isNull()) {

//        QTreeWidgetItem *item = new QTreeWidgetItem();
//        item->setText(0, element.tagName());
//        parentItem->addChild(item);

//        examineChildElements(element, item);

//        element = element.nextSibling();
//    }
}

void Window::RecursiveFindFile(const QString &path, Json::Value &out)
{
    QDir dir(path);
    if (!dir.exists())
    return;

    dir.setFilter(QDir::Dirs|QDir::Files);//除了目录或文件，其他的过滤掉
    dir.setSorting(QDir::DirsFirst);//优先显示目录
    QFileInfoList list = dir.entryInfoList();//获取文件信息列表

    int i = 0;
    bool bIsDir;
    do{
        QFileInfo fileInfo = list.at(i);
        i += 1;
        QString fileName = fileInfo.fileName();
        if(fileName[0] == '.' || fileName[0] == '_')
        {
             continue;
        }

        QString baseName = fileInfo.baseName();
        Json::Value val;
        val["text"] = baseName.toStdString();
        val["id"] = baseName.toStdString();
        Json::Value att;
        att["path"] = fileInfo.absoluteFilePath().replace("/","\\").toStdString();
        val["attributes"] = att;

        bIsDir = fileInfo.isDir();
        if (bIsDir)
        {
            val["state"]="closed";
            Json::Value child;
            RecursiveFindFile(fileInfo.absoluteFilePath(), child);        // 递归;
            val["children"] = child;
        }

         out.append(val);
    }while(i<list.size());
}
//! [traverse document]
