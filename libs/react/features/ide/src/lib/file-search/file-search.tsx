import { useCallback, useState } from 'react';
import { CommandPalette, CommandPaletteItem } from '@org/react-ui';
import { fileExplorerService, useAuthStore, useCodeEditorStore } from '@org/react-data-access';

interface FileSearchProps {
  onClose: () => void;
}

export function FileSearch({ onClose }: FileSearchProps) {
  const [items, setItems] = useState<CommandPaletteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearchChanged = useCallback(async (query: string) => {
    if (!query.trim()) {
      setItems([]);
      return;
    }

    const rootPath = useAuthStore.getState().workspace?.rootPath;
    if (!rootPath) return;

    setLoading(true);
    const { success, data } = await fileExplorerService.searchFiles(query, rootPath);
    setLoading(false);

    if (success) {
      setItems(data.map((file) => ({ id: file.path, label: file.name, description: file.path })));
    }
  }, []);

  const onItemSelected = useCallback(
    (item: CommandPaletteItem) => {
      onClose();
      useCodeEditorStore.getState().fetchAndOpenFile(item.id);
    },
    [onClose],
  );

  return (
    <CommandPalette
      items={items}
      placeholder="Search files by name..."
      loading={loading}
      onItemSelected={onItemSelected}
      onSearchChanged={onSearchChanged}
      onClose={onClose}
    />
  );
}
