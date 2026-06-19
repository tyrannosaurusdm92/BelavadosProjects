'use client';
import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import clsx from 'clsx';

import { title } from './primitives';

import { useLanguageContext } from '@/providers/language-provider';
import { showBrand } from '@/utils/brand';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { t } = useLanguageContext();

  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <header
      className={clsx(
        'flex w-full min-w-[375px] flex-col items-center justify-center space-y-4 p-6',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {showBrand && (
          <Image
            alt="302"
            className="size-6 object-contain sm:size-8 md:size-10"
            src="https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png"
          />
        )}
        <h1 className={title({ size: 'sm' })}>{t('home.header.title')}</h1>
      </div>
      <Modal
        hideCloseButton
        isOpen={isOpen}
        placement="center"
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
              <ModalBody className="divide-y-1" />
              <ModalFooter className="flex-x flex items-center justify-between" />
            </>
          )}
        </ModalContent>
      </Modal>
    </header>
  );
}
