import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
} from '@nextui-org/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { CustomModel } from './page/home-page';

import HistoryItem from '@/components/history-item';
import { useLanguageContext } from '@/providers/language-provider';
import { SessionState, useSessionStore } from '@/stores/use-session-store';
import { useSessionStateDB } from '@/utils/session-db';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  customModels: CustomModel[];
}

export default function HistoryModal({
  customModels,
  isOpen,
  onClose,
  onOpenChange,
}: HistoryModalProps) {
  const { t } = useLanguageContext();
  const { updateSession } = useSessionStore((state) => ({
    updateSession: state.updateSession,
  }));
  const { queryPaginated, remove } = useSessionStateDB();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState<SessionState[]>([]);

  const pageSize = 10; // Number of items per page

  useEffect(() => {
    fetchHistory();
  }, [isOpen, currentPage, searchQuery]);

  const fetchHistory = async () => {
    const query: Partial<
      Pick<SessionState, 'platform' | 'speaker' | 'language' | 'text'>
    > = {};

    if (searchQuery) {
      query.text = searchQuery;
    }

    const { results, totalPages } = await queryPaginated(
      query,
      currentPage,
      pageSize
    );

    setSearchResults(
      results.map((session) => ({ ...session, id: session.id || '' }))
    );
    setTotalPages(totalPages);
  };

  const handleRestoreHistory = async (session: SessionState) => {
    updateSession({
      ...session,
      audioSrc: window.URL.createObjectURL(session.audio as Blob),
    });
    toast.success(t('success.restore'));
    onClose();
  };

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
      toast.success(t('success.remove'));
      fetchHistory(); // Refresh the history list after removal
    } catch (error) {
      toast.error(t('error.remove'));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-1">
              <h2>{t('home.header.history.title')}</h2>
            </ModalHeader>
            <ModalBody className="divide-y-1">
              {searchResults.length === 0 ? (
                <div className="h-32 w-full">
                  <p className="text-center">
                    {t('home.header.history.empty')}
                  </p>
                </div>
              ) : (
                searchResults.map((session) => (
                  <HistoryItem
                    key={session.id}
                    customModels={customModels}
                    session={session}
                    t={t}
                    onRemove={handleRemove}
                    onRestore={handleRestoreHistory}
                  />
                ))
              )}
            </ModalBody>
            <ModalFooter className="flex w-full items-center justify-between">
              <Pagination
                className="flex w-full items-center justify-center"
                initialPage={1}
                page={currentPage}
                total={totalPages}
                onChange={handlePageChange}
              />
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
