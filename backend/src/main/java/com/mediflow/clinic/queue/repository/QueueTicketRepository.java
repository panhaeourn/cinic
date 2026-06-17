package com.mediflow.clinic.queue.repository;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mediflow.clinic.queue.entity.QueueTicket;

public interface QueueTicketRepository extends JpaRepository<QueueTicket, UUID>, JpaSpecificationExecutor<QueueTicket> {

	@Query("select coalesce(max(ticket.queueNumber), 0) from QueueTicket ticket where ticket.queueDate = :queueDate")
	int findMaxQueueNumber(@Param("queueDate") LocalDate queueDate);
}
