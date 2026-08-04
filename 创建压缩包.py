#!/usr/bin/env python3
import subprocess
import os
import sys
import zipfile
from datetime import datetime

# 创建压缩包，并忽略git信息和git忽略的文件和自身
# 由 gemma4 26BA4B 修复打包对汉字支持问题。

# 配置参数 (Configuration)
# 1. 压缩包文件名前缀
# 默认：使用当前文件夹的名字 + 时间戳 (例如: my_project_20231027_103000.zip)
# 如果你希望固定文件名，可以将其改为字符串，例如: ARCHIVE_PREFIX = "backup"
ARCHIVE_PREFIX = "ra2字体编辑器1.x" 

# 2. 压缩等级 0 - 9
# 0 : 仅存储 (Stored)，不进行压缩，速度最快，文件体积最大。
# 1 : 压缩速度最快，但压缩率最低（文件体积相对较大）。
# 6 : 默认平衡值，在压缩速度和文件体积之间取得较好的平衡。
# 9 : 压缩率最高，但压缩过程最慢，且消耗 CPU 资源较多。
COMPRESSION_LEVEL = 6

def get_files_to_compress():
    """
    使用 git ls-files -z 获取文件列表，彻底解决汉字乱码问题。
    """
    try:
        # 使用 -z 参数，用 NUL (\0) 分隔文件名，避免编码转换导致路径解析失败
        result = subprocess.run(
            ['git', 'ls-files', '-z', '-c', '-o', '--exclude-standard', '.'],
            capture_output=True,
            check=True
        )
        
        raw_stdout = result.stdout
        # 按 NUL 字节切割
        file_names_bytes = raw_stdout.split(b'\0')
        
        files = []
        current_script = os.path.abspath(__file__)

        for name_bytes in file_names_bytes:
            if not name_bytes:
                continue
            
            try:
                # 强制使用 utf-8 解码 Git 的输出
                file_rel_path = name_bytes.decode('utf-8').strip().replace('\\', '/')
            except UnicodeDecodeError:
                print(f"警告：无法解码文件名字节流，跳过该文件。", file=sys.stderr)
                continue

            # 过滤逻辑
            if file_rel_path == '.gitignore':
                continue
            if os.path.abspath(file_rel_path) == current_script:
                continue
            if file_rel_path.startswith('.'):
                continue

            files.append(file_rel_path)
            
        return files
    except subprocess.CalledProcessError:
        print("错误：当前目录不是 Git 仓库，无法应用 .gitignore 规则。", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"获取文件列表时出错: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    # 计算文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    if ARCHIVE_PREFIX:
        archive_name = f"{ARCHIVE_PREFIX}_{timestamp}.zip"
    else:
        dir_name = os.path.basename(os.path.abspath(os.getcwd()))
        archive_name = f"{dir_name}_{timestamp}.zip"

    files = get_files_to_compress()
    if not files:
        print("没有需要压缩的文件。")
        return

    print(f"配置信息：")
    print(f"  - 压缩等级: {COMPRESSION_LEVEL}")
    print(f"  - 目标文件: {archive_name}")
    print(f"  - 文件数量: {len(files)}")
    print("-" * 30)

    try:
        # 使用 compresslevel 参数设置压缩等级 (Python 3.7+)
        # ZIP_DEFLATED 是标准压缩算法
        with zipfile.ZipFile(
            archive_name, 
            'w', 
            zipfile.ZIP_DEFLATED, 
            compresslevel=COMPRESSION_LEVEL
        ) as zf:
            for rel_path in files:
                abs_path = os.path.abspath(rel_path)
                
                if not os.path.exists(abs_path):
                    print(f"警告：文件不存在: {abs_path}", file=sys.stderr)
                    continue

                # 写入压缩包，arcname 使用相对路径，保证解压后目录结构正确
                zf.write(abs_path, rel_path)
                
        print(f"\n成功！压缩包已生成: {os.path.abspath(archive_name)}")

    except Exception as e:
        print(f"\n压缩过程中发生错误: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
